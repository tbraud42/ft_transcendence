# policies/myapp-policy.hcl

path "secret/data/myapp/config" {
  capabilities = ["read"]
}
