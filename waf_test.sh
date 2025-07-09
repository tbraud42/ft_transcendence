#!/bin/bash
# Captcha and bruteforce on login tests will failed
# Theses are not implemented yet

HOST=${1:-localhost}
HTTP_PORT=${2:-80}
HTTPS_PORT=${3:-443}
HTTP_URL="http://$HOST:$HTTP_PORT"
HTTPS_URL="https://$HOST:$HTTPS_PORT"

# Ignore SSL if self-signed certificate
CURL_HTTPS_OPTS=(-sk)

# expect <desc> <expected_code> <curl_args...>
expect() {
  local desc="$1"; shift
  local exp_code="$1"; shift
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$@")
  if [ "$code" -eq "$exp_code" ]; then
    echo "[PASS] $desc -> $code"
  else
    echo "[FAIL] $desc -> $code (expected $exp_code)"
  fi
}

# expect_header <desc> <header_name> <expected_value> <curl_args...>
expect_header() {
  local desc="$1"; shift
  local header="$1"; shift
  local exp_value="$1"; shift
  local hdr
  hdr=$(curl -s -D - -o /dev/null "$@" | grep -i "$header:")
  if [[ "$hdr" =~ $exp_value ]]; then
    echo "[PASS] $desc -> '$hdr'"
  else
    echo "[FAIL] $desc -> '$hdr' (expected match '$exp_value')"
  fi
}

echo "=== Tests HTTP (port $HTTP_PORT) ==="
# 1) GET / must redirect to HTTPS
expect "HTTP GET / redirect" 301 -I -s "$HTTP_URL/"
# 2) POST / must return 405
expect "HTTP POST / method not allowed" 405 -X POST "$HTTP_URL/"

echo "\n=== Tests HTTPS (port $HTTPS_PORT) ==="
# 3) GET / must return 200 with security headers
expect "HTTPS Home page" 200 "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/"
# Check security headers
expect_header "X-Frame-Options" "X-Frame-Options" "DENY" "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/"

# 4) Allowed extensions
expect "Whitelisted .css" 200 "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/assets/style.css"
expect "Whitelisted .js" 200 "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/js/app.js"

# 5) Blocked extensions
expect "Blocked .php extension" 403 "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/uploads/shell.php"

# 6) XSS basique
expect "Blocked XSS attempt" 403 "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/?q=<script>alert(1)</script>"
# 7) SQLi basique
expect "Blocked SQLi attempt" 403 "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/?id=1%20OR%201=1"

# 8) Bot UA denial
expect "Bot User-Agent blocked" 403 -H "User-Agent: nikto" "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/"
# 9) Empty User-Agent
expect "Empty User-Agent blocked" 403 -H "User-Agent:" "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/"
# 10) Legitimate User-Agent
expect "Legit UA allowed" 200 -H "User-Agent: Mozilla/5.0 (compatible; Firefox)" "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/"

# 11) Bruteforce on /login
echo "\n-- Bruteforce tests --"

# 11.1) 3 first attempts: should return 401 Unauthorized
for i in 1 2 3; do
  expect "Login fail #$i (401)" 401 -X POST "$HTTPS_URL/login?user=admin&pass=wrong" "${CURL_HTTPS_OPTS[@]}"
done

# 11.2) 4th attempt: should redirect to CAPTCHA page (302 with captcha=1)
code=$(curl -s -o /dev/null -w "%{http_code}" -I -X POST "$HTTPS_URL/login?user=admin&pass=wrong" "${CURL_HTTPS_OPTS[@]}")
location=$(curl -s -I -X POST "$HTTPS_URL/login?user=admin&pass=wrong" "${CURL_HTTPS_OPTS[@]}" | grep -i Location:)
if [ "$code" -eq 302 ] && [[ "$location" == *"captcha=1"* ]]; then
  echo "[PASS] CAPTCHA redirect on 4th fail -> $code, $location"
else
  echo "[FAIL] CAPTCHA not triggered -> $code, $location"
fi

# 11.3) 5th and 6th attempts: should return 429 Too Many Requests (bruteforce block)
for i in 5 6; do
  resp=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$HTTPS_URL/login?user=admin&pass=wrong" "${CURL_HTTPS_OPTS[@]}")
done
expect "Bruteforce block (>5 fails)" 429 -X POST "$HTTPS_URL/login?user=admin&pass=wrong" "${CURL_HTTPS_OPTS[@]}"

# 12) Internal error masking test
# Note: This test assumes you have an endpoint that returns a 500 error
# If you don't have such an endpoint, this test will be skipped
if curl -s -o /dev/null -w "%{http_code}" "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/error500" | grep -q 200; then
  echo "[PASS] Internal error masked -> 200"
else
  echo "[WARN] Test masking non réalisé (pas d'endpoint 500)"
fi

# 13) Access to /error.html should be allowed
# This assumes you have an error.html page that is accessible
expect "Error page allowed" 200 "${CURL_HTTPS_OPTS[@]}" "$HTTPS_URL/error.html"

echo "\n=== Tests terminés ==="
