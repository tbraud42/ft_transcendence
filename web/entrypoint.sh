#!/bin/sh
set -e

rm -rf /app/dist/*

npm run build

# Copy every files from /app/src/* to /app/dist exluding all .ts files
cd /app/src
find . -type f ! -name "*.ts" -exec cp --parents {} /app/dist/ \;