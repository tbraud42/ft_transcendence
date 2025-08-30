# policies/myapp-policy.hcl

path "secret/data/myapp/config" {
  capabilities = ["read"]
}

path "secret/data/myapp/sqlite_api" {
  capabilities = ["read"]
}
path "secret/data/myapp/ws_server" {
  capabilities = ["read"]
}

path "secret/data/myapp/web" {
  capabilities = ["read"]
}
path "secret/data/myapp/nginx" {
  capabilities = ["read"]
}