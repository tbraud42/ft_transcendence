#!/bin/sh
set -eu

WEBROOT="${WEBROOT:-/usr/share/nginx/html}"
APP_ENV_PATH="${APP_ENV_PATH:-/secrets/web/app.env}"

# Wait app.env from vault
i=0
while [ ! -s "$APP_ENV_PATH" ] && [ "$i" -lt 50 ]; do
  i=$((i+1))
  sleep 0.2
done

if [ -f "$APP_ENV_PATH" ]; then
  . "$APP_ENV_PATH"
fi

API_URL="${API_URL:-${VITE_API_URL:-/api}}"
DOMAIN="${DOMAIN:-${VITE_DOMAIN:-localhost}}"
PONG_WS_URL="${PONG_WS_URL:-${VITE_PONG_WS_URL:-ws://localhost:3000}}"

# Create config.js
cat > "$WEBROOT/config.js" <<EOF
window.__APP_CONFIG__ = {
  API_URL: "$(printf %s "$API_URL")",
  DOMAIN: "$(printf %s "$DOMAIN")",
  PONG_WS_URL: "$(printf %s "$PONG_WS_URL")",
  VITE_API_URL: "$(printf %s "$API_URL")",
  VITE_DOMAIN: "$(printf %s "$DOMAIN")",
  VITE_PONG_WS_URL: "$(printf %s "$PONG_WS_URL")"
};
EOF
