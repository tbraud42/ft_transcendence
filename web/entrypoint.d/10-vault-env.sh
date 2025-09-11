#!/bin/sh
set -eu

if [ -x /scripts/vault-run.sh ]; then
  /scripts/vault-run.sh /secrets/web/app.env || true
fi
