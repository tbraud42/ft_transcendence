#!/usr/bin/env sh
set -Eeuo pipefail

: "${VAULT_ADDR:=https://dev.local:8200}"
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
if ! vault status -format=json -tls-skip-verify | jq -e '.initialized==true' >/dev/null; then
  echo "Initializing Vault..."
  vault operator init -key-shares=1 -key-threshold=1 > /vault/file/init.json
  echo "init json file created"
fi

#	Key extraction
UNSEAL_KEY="$(jq -r '.unseal_keys_b64[0]' /vault/file/init.json)"
ROOT_TOKEN="$(jq -r '.root_token'        /vault/file/init.json)"
export VAULT_TOKEN="$ROOT_TOKEN"

#	Unseal
#	TODO: Remove tls-skip-verify when certs are in place
if vault status -format=json -tls-skip-verify | jq -e '.sealed==true' >/dev/null; then
  echo "Unsealing..."
  vault operator unseal -tls-skip-verify "$UNSEAL_KEY"
fi


echo "Running Vault config..."
/usr/local/bin/vault_config.sh
echo "Vault configured."

wait "$VAULT_PID"
