FROM hashicorp/vault:latest

RUN apk add --no-cache curl

RUN apk add --no-cache jq

RUN apk add --no-cache openssl

COPY config/vault.hcl /vault/config/vault.hcl
COPY init_unseal.sh /usr/local/bin/init_unseal.sh
COPY vault_config.sh /usr/local/bin/vault_config.sh

RUN chmod +x /usr/local/bin/init_unseal.sh
RUN chmod +x /usr/local/bin/vault_config.sh

ENTRYPOINT ["/usr/local/bin/init_unseal.sh"]