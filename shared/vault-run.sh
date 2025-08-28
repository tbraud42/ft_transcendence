#!/bin/sh
# Usage: vault-run.sh /path/to/app.env <command> [args...]
set -eu
ENV_PATH="${1:?error env path is empty}"; shift

# Wait until Vault Agent rendered the file and it's non-empty
until [ -s "$ENV_PATH" ]; do
  echo "Waiting for $ENV_PATH from Vault Agent..."
  sleep 1
done

# Export env vars from the file into this process
set -a
. "$ENV_PATH"
set +a

# Chain to the real process (become PID 1)
exec "$@"
