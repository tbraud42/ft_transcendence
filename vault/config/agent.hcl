# config/agent.hcl

exit_after_auth = false
pid_file = "/tmp/vault-agent.pid"

auto_auth {
  method "approle" {
    config = {
      role_id_file_path   = "/vault/file/role_id.txt"
      secret_id_file_path = "/vault/file/secret_id.txt"
      remove_secret_id_file_after_reading=false
    }
  }

  sink "file" {
    config = {
      path = "/vault/.agent-token"
    }
  }
}

# TODO: Generic credential - will be removed
template {
  source      = "/vault/templates/app.env.tpl"
  destination = "/secrets/app.env"
}

# Separate credential

template {
  source      = "/vault/templates/app.env.tpl"
  destination = "/secrets/sqlite_api/app.env"
}
template {
  source      = "/vault/templates/app.env.tpl"
  destination = "/secrets/ws_server/app.env"
}