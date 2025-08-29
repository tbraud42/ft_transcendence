#!/usr/bin/env sh
set -Eeuo pipefail

# TODO: debug lines, need to be remove
set -x
trap 'echo "ERR at line $LINENO"; exit 1' ERR

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
if [ "$(curl -sk "$VAULT_ADDR/v1/sys/init" | jq -r '.initialized')" != "true" ]; then
  echo "Initializing Vault..."
  vault operator init -key-shares=1 -key-threshold=1 -format=json > /vault/file/init.json
  echo "init json file created"
fi

#TODO: remove and retest 

# Si Vault est déjà initialisé mais qu'on n'a pas l'init.json, on explique quoi faire
if curl -sk "$VAULT_ADDR/v1/sys/init" | jq -e '.initialized == true' >/dev/null 2>&1; then
  if [ ! -s /vault/file/init.json ]; then
    echo "ERROR: Vault est déjà initialisé mais /vault/file/init.json est manquant."
    echo " - En dev: supprime le volume 'vault_data' et relance."
    echo " - Sinon: fournis le bon init.json (unseal_keys_b64 + root_token) pour cette instance."
    exit 1
  fi
fi

#	Key extraction
UNSEAL_KEY="$(jq -er '.unseal_keys_b64[0]' /vault/file/init.json)"
ROOT_TOKEN="$(jq -er '.root_token'        /vault/file/init.json)"
export VAULT_TOKEN="$ROOT_TOKEN"

#	Unseal
#	TODO: Remove tls-skip-verify when certs are in place
if [ "$(curl -sk "$VAULT_ADDR/v1/sys/health" | jq -r '.sealed')" = "true" ]; then
  echo "Unsealing..."
  vault operator unseal -tls-skip-verify "$UNSEAL_KEY"
fi


echo "Running Vault config..."
/usr/local/bin/vault_config.sh
echo "Vault configured."

wait "$VAULT_PID"
