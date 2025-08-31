# policies/myapp-policy.hcl

path "secret/data/myapp/*" {
  capabilities = ["read"]
}

path "secret/metadata/myapp/*" {
  capabilities = ["read", "list"]
}

path "sys/internal/ui/mounts/secret" {
  capabilities = ["read"]
}

path "sys/internal/ui/mounts/secret/*" {
  capabilities = ["read"]
}
