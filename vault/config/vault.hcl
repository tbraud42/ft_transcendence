# config/config.hcl

ui = true

storage "file" {
	path = "/vault/data"
}

listener "tcp" {
	address = "0.0.0.0:8200"
	tls_cert_file = "/vault/certs/vault.cert"
	tls_key_file  = "/vault/certs/vault.key"
	tls_min_version = "tls12"
}

api_addr = "https://vault:8200"

cluster_addr = "https://vault:8201"

# mlock security 
disable_mlock = true

#audit 
audit "file" {
	path= "/vault/logs/audit.log"
}
