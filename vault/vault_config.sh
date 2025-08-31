#!/bin/sh

set -Eeuo pipefail
umask 077

: "${VAULT_ADDR:=https://vault:8200}"
export VAULT_ADDR

until [ "$(curl -sk "$VAULT_ADDR/v1/sys/health" | jq -r '.sealed')" = "false" ]; do
  echo "Waiting for Vault to be unsealed..."
  sleep 2
done

echo "Configuring Vault..."

# Activate kv v2
vault secrets disable secret/ || true
vault secrets enable -path=secret -version=2 kv

# Check for secrets directory then load all secrets
if [ ! -d /run/secrets ]; then
  echo "No /run/secrets directory found!"
  exit 1
fi

TMP_JSON="/run/vault_seed.$$.json"
{
  printf '{'
  first=true
  for f in /run/secrets/*; do
    [ -f "$f" ] || continue
    key="$(basename "$f")"
    val="$(cat "$f" | jq -Rsa .)"
    if [ "$first" = true ]; then
      first=false
    else
      printf ','
    fi
    printf '"%s": %s' "$key" "$val"
  done
  printf '}'
} > "$TMP_JSON"

# Write secret on CAS = 0 to avoid overwriting
# CAS (Check-And-Set) : create only if not exists
vault kv put -mount=secret -cas=0 myapp/config @"$TMP_JSON" || true
rm -f "$TMP_JSON"
echo "KV written at secret/data/myapp/config"

# Creation of minimal policy
cat > /vault/file/myapp-policy.hcl <<'HCL'
path "secret/data/myapp/config" {
  capabilities = ["read"]
}
HCL
vault policy write myapp-policy /vault/file/myapp-policy.hcl


# Approle enable
if ! vault auth list -format=json | grep -q '"approle/"'; then
  echo "Enabling AppRole..."
  vault auth enable approle
fi

vault write auth/approle/role/myapp \
  token_policies="myapp-policy" \
  token_ttl="1h" token_max_ttl="4h" \
  secret_id_num_uses=1 secret_id_ttl="30m"

# Create RoleId and SecretID
ROLE_ID="$(vault read -field=role_id auth/approle/role/myapp/role-id)"
printf "%s\n" "$ROLE_ID" > /vault/file/role_id.txt

SECRET_ID="$(vault write -f -field=secret_id auth/approle/role/myapp/secret-id)"
printf "%s\n" "$SECRET_ID" > /vault/file/secret_id.txt

# response wrapping (wrapping_token 1 usage, short TTL)
WRAP_JSON="$(vault write -wrap-ttl=5m -f auth/approle/role/myapp/secret-id -format=json)"
WRAP_TOKEN="$(printf "%s" "$WRAP_JSON" | sed -n 's/.*"wrapping_token":"\([^"]*\)".*/\1/p')"
[ -n "$WRAP_TOKEN" ] && printf "%s\n" "$WRAP_TOKEN" > /vault/file/wrapping_token.txt

touch /vault/file/.vault_configured
