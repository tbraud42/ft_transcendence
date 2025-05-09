#!/bin/bash

set -e

CERT_DIR="/etc/nginx/certs"
DOMAIN_NAME=${DOMAIN_NAME:-localhost}
ADMIN_EMAIL="admin@${DOMAIN_NAME}"

CERT_FILE="$CERT_DIR/fullchain.pem"
KEY_FILE="$CERT_DIR/privkey.pem"

function selfsigned_cert() {
    NAME=$1
    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout "$KEY_FILE""_""$NAME" \
        -out "$CERT_FILE""_""$NAME" \
        -subj "/C=FR/ST=France/L=Local/O=Dev/OU=SelfSigned/CN=$NAME"
    echo "Self-signed certificate created for $NAME"
}

echo "Checking if certificate already exists..."
if [[ -f "$CERT_FILE" && -f "$KEY_FILE" ]]; then
    echo "Certificate already exists, skipping generation."
else
    echo "Attempting to generate SSL certificate for $DOMAIN_NAME & api.$DOMAIN_NAME..."

    certbot certonly --standalone --non-interactive --agree-tos \
        --email "$ADMIN_EMAIL" \
        -d "$DOMAIN_NAME" \
        -d "api.$DOMAIN_NAME" || {

        echo "Let's Encrypt certificate generation failed. Generating a fallback self-signed certificate."

        selfsigned_cert "$DOMAIN_NAME"
        selfsigned_cert "api.$DOMAIN_NAME"
    }
fi

# Replace DOMAIN_NAME and API_PORT in Nginx configuration /etc/nginx/nginx.conf
echo "Replacing DOMAIN_NAME and API_PORT in Nginx configuration..."
sed -i "s/DOMAIN_NAME/$DOMAIN_NAME/g" /etc/nginx/nginx.conf
sed -i "s/API_PORT/$API_PORT/g" /etc/nginx/nginx.conf
sed -i "s/WEB_PORT/$WEB_PORT/g" /etc/nginx/nginx.conf

echo "Starting Nginx..."
exec nginx -g "daemon off;"