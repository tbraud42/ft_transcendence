# config/config.hcl

ui = true

storage "file" {
	path = "/vault/data"
}

listener "tcp" {
	address = "0.0.0.0:8200"
	tls_cert_file = "/vault/certs/vault.crt"
	tls_key_file  = "/vault/certs/vault.key"
	tls_min_version = "tls12"
}

# Public Vault adress for Vault's agent
#    - If reverse-proxy TLS (nginx) DNS : https://vault.example.com:443
#    - Or : https://vault.example.com:8200
api_addr = "https://vault:8200"

# cluster_addr = "https://vault.example.com:8201"

# mlock security 
disable_mlock = true

#audit 
audit "file" {
	path= "/vault/logs/audit.log"
}
