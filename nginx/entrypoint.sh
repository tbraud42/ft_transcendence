#!/bin/bash

set -e

CERT_DIR="/etc/nginx/certs"
DOMAIN_NAME=${DOMAIN_NAME:-localhost}
ADMIN_EMAIL="admin@${DOMAIN_NAME}"

CERT_FILE="$CERT_DIR/fullchain.pem"
KEY_FILE="$CERT_DIR/privkey.pem"

function selfsigned_cert() {
    NAME=$1
    KEY="$KEY_FILE"_"$NAME"
    CERT="$CERT_FILE"_"$NAME"

    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout "$KEY" \
        -out "$CERT" \
        -subj "/C=FR/ST=France/L=Local/O=Dev/OU=SelfSigned/CN=$NAME"

    # Key and certificate are merged into fullchain.pem
    cat "$CERT" "$KEY" > "$CERT_DIR/fullchain.pem_$NAME"

    echo "Self-signed certificate created and merged for $NAME"
}

echo "Checking if certificate already exists..."
if [[ -f "$CERT_FILE" && -f "$KEY_FILE" ]]; then
    echo "Certificate already exists, skipping generation."
else
    echo "Attempting to generate SSL certificate for $DOMAIN_NAME & api.$DOMAIN_NAME..."

    certbot certonly --standalone --non-interactive --agree-tos \
        --email "$ADMIN_EMAIL" \
        -d "$DOMAIN_NAME" -d "api.$DOMAIN_NAME" --debug --verbose

    if [ $? -ne 0 ]; then
        echo "Let's Encrypt certificate generation failed. Generating a fallback self-signed certificate."
        selfsigned_cert "$DOMAIN_NAME"
        selfsigned_cert "api.$DOMAIN_NAME"
    else
        LE_LIVE_DIR="/etc/letsencrypt/live/$DOMAIN_NAME"
        cp "$LE_LIVE_DIR/fullchain.pem" "$CERT_DIR/fullchain.pem_$DOMAIN_NAME"
        cp "$LE_LIVE_DIR/privkey.pem" "$CERT_DIR/privkey.pem_$DOMAIN_NAME"
        echo "[SUCCESS] Let's Encrypt certificates copied to $CERT_DIR"
    fi
fi

# Replace DOMAIN_NAME and API_PORT in Nginx configuration /etc/nginx/nginx.conf
echo "Replacing DOMAIN_NAME and API_PORT in Nginx configuration..."
sed -i "s/DOMAIN_NAME/$DOMAIN_NAME/g" /etc/nginx/nginx.conf
sed -i "s/API_PORT/$API_PORT/g" /etc/nginx/nginx.conf

echo "Starting Nginx..."
exec nginx -g "daemon off;"