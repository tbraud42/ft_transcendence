#!/usr/bin/env sh
set -eu

CERT_DIR="${CERT_DIR:-/vault/certs}"
KEY_FILE="${KEY_FILE:-$CERT_DIR/vault.key}"
CERT_FILE="${CERT_FILE:-$CERT_DIR/vault.cert}"
VAULT_SANS="${VAULT_SANS:-vault,dev.local}"
export VAULT_ADDR="${VAULT_ADDR:-https://vault:8200}"

#Generate Certs if needed
umask 077
mkdir -p "$CERT_DIR"
SAN_LIST=$(echo "$VAULT_SANS" | awk -F, '{for(i=1;i<=NF;i++){printf (i>1?",DNS:%s":"DNS:%s"), $i}}')
if [ ! -s "$KEY_FILE" ] || [ ! -s "$CERT_FILE" ]; then
  echo "[vault-entrypoint] Génération d’un cert auto-signé CN=vault SAN=$SAN_LIST"
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/CN=vault" \
    -addext "basicConstraints=CA:TRUE" \
    -addext "keyUsage=digitalSignature,keyEncipherment,keyCertSign" \
    -addext "extendedKeyUsage=serverAuth" \
    -addext "subjectAltName=$SAN_LIST"
    
  chmod 600 "$KEY_FILE"
  chmod 644 "$CERT_FILE"
  cp -f "$CERT_FILE" /usr/local/share/ca-certificates/vault.crt || true
  update-ca-certificates || true
else
  echo "[vault-entrypoint] Certificat déjà présent, on ne régénère pas."
fi


# Launching
vault server -config=/vault/config/vault.hcl & VAULT_PID=$!

# Wait API response
until curl -sk "$VAULT_ADDR/v1/sys/health" >/dev/null 2>&1; do
  echo "Waiting for Vault to start..."
  sleep 2
done

umask 077

if [ "$(curl -sk "$VAULT_ADDR/v1/sys/init" | jq -r '.initialized')" != "true" ]; then
  echo "Initializing Vault..."
  vault operator init -key-shares=1 -key-threshold=1 -format=json > /vault/file/init.json
  echo "init json file created"
fi

#	Key extraction
UNSEAL_KEY="$(jq -er '.unseal_keys_b64[0]' /vault/file/init.json)"
ROOT_TOKEN="$(jq -er '.root_token'        /vault/file/init.json)"
export VAULT_TOKEN="$ROOT_TOKEN"

#	Unseal
if [ "$(curl -sk "$VAULT_ADDR/v1/sys/health" | jq -r '.sealed')" = "true" ]; then
  echo "Unsealing..."
  vault operator unseal "$UNSEAL_KEY"
fi

echo "Running Vault config..."
/usr/local/bin/vault_config.sh
echo "Vault configured."

wait "$VAULT_PID"
