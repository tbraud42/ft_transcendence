#!/bin/bash
# set -euo pipefail

while [ ! -f /secrets/nginx/app.env ]; do
    echo "[INFO] Waiting for /secrets/nginx/app.env to be available..."
    sleep 2
done

# Load environment variables from the .env file
set -o allexport
source /secrets/nginx/app.env
set +o allexport


echo "[INFO] Environment variables loaded."

CERT_DIR="/etc/nginx/certs"
DOMAIN_NAME="${DOMAIN_NAME:-localhost}"
WEB_PORT="${WEB_PORT:-80}"
ADMIN_EMAIL="admin@${DOMAIN_NAME}"
LE_LIVE_DIR="/etc/letsencrypt/live/$DOMAIN_NAME"
CERT_FILE="$CERT_DIR/fullchain.pem_$DOMAIN_NAME.crt"
KEY_FILE="$CERT_DIR/privkey.pem_$DOMAIN_NAME.key"


# Generate self-signed certificates 
function selfsigned_cert() {
    NAME=$1
    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout "$CERT_DIR/privkey.pem_$NAME.key" \
        -out "$CERT_DIR/fullchain.pem_$NAME.crt" \
        -subj "/C=FR/ST=France/L=Local/O=Dev/OU=SelfSigned/CN=$NAME" \
        -addext "subjectAltName=DNS:$NAME" 
    echo "[INFO] Self-signed certificate created for $NAME"
}

echo "[INFO] Checking if certificate already exists..."
if [[ -f "$CERT_FILE" && -f "$KEY_FILE" ]]; then
    echo "[INFO] Certificate already exists, skipping generation."
else
    echo "[INFO] Attempting to generate SSL certificate for $DOMAIN_NAME & api.$DOMAIN_NAME..."

    certbot certonly --standalone --non-interactive --agree-tos \
        --email "$ADMIN_EMAIL" \
        -d "$DOMAIN_NAME" \
        -d "api.$DOMAIN_NAME" \
        -d "pong.ws.$DOMAIN_NAME" \
        --verbose --debug --quiet 2>/dev/null
    CERTBOT_EXIT_CODE=$?
    set -e

    if [[ $CERTBOT_EXIT_CODE -ne 0 ]]; then
        echo "[WARN] Let's Encrypt certificate generation failed (exit code $CERTBOT_EXIT_CODE)."
        echo "[INFO] Generating fallback self-signed certificates..."

        selfsigned_cert "$DOMAIN_NAME"
        selfsigned_cert "api.$DOMAIN_NAME"
    elif [[ -f "$LE_LIVE_DIR/fullchain.pem" && -f "$LE_LIVE_DIR/privkey.pem" ]]; then
        cp "$LE_LIVE_DIR/fullchain.pem" "$CERT_FILE"
        cp "$LE_LIVE_DIR/privkey.pem" "$KEY_FILE"

        echo "[SUCCESS] Let's Encrypt certificates copied to $CERT_DIR"
    else
        echo "[ERROR] Let's Encrypt certificates not found after generation."
        echo "[INFO] Generating fallback self-signed certificates..."
        selfsigned_cert "$DOMAIN_NAME"
        selfsigned_cert "api.$DOMAIN_NAME"
        selfsigned_cert "pong.ws.$DOMAIN_NAME"
    fi
fi

echo "[INFO] Replacing DOMAIN_NAME and WEB_PORT in Nginx configuration..."
sed -i "s/DOMAIN_NAME/$DOMAIN_NAME/g" /etc/nginx/nginx.conf
sed -i "s/WEB_PORT/$WEB_PORT/g" /etc/nginx/nginx.conf

echo "[INFO] Starting Nginx..."
exec nginx -g "daemon off;"
