#!/usr/bin/env sh
set -Eeuo pipefail

: "${VAULT_ADDR:=https://vault:8200}"
export VAULT_ADDR
[ -n "${VAULT_CACERT:-}" ] || export VAULT_SKIP_VERIFY=true

# Launching
vault server -config=/vault/config/vault.hcl & VAULT_PID=$!

# Wait API response
until curl -sk "$VAULT_ADDR/v1/sys/health" >/dev/null 2>&1; do
  echo "Waiting for Vault to start..."
  sleep 2
done

umask 077

#	TODO: Remove tls-skip-verify when certs are in place
if vault status -format=json -tls-skip-verify | jq -e 'initialized' | grep -q true; then
  echo "Initializing Vault..."
  vault operator init -key-shares=1 -key-threshold=1 > /vault/file/init.txt
  echo "init txt file created"
fi

#	Key extraction
UNSEAL_KEY="$(awk '/Unseal Key 1:/ {print $NF}' /vault/file/init.txt)"
ROOT_TOKEN="$(awk '/Initial Root Token:/ {print $NF}' /vault/file/init.txt)"
export VAULT_TOKEN="$ROOT_TOKEN"

#	Unseal
echo "Unsealing..."
#	TODO: Remove tls-skip-verify when certs are in place
vault operator unseal -tls-skip-verify "$UNSEAL_KEY"

echo "Running Vault config..."
/usr/local/bin/vault_config.sh
echo "Vault configured."

wait "$VAULT_PID"
