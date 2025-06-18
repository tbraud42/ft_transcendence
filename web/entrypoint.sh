#!/bin/sh
set -e

npm run watch & # Start the watch process in the background

#copy all assets to the public directory excluding all .ts files
rsync -a --exclude='*.ts' --exclude='*.js' --exclude='*.map' --exclude='.git' ./src/ ./dist/

npm run copy-assets # Sync assets to the public directory