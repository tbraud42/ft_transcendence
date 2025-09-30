#!/bin/sh
set -eu

mkdir -p /run/approle
cp /vault/file/role_id.txt /run/approle/
cp /vault/file/secret_id.txt /run/approle/

exec vault agent -config=/vault/config/agent.hcl
