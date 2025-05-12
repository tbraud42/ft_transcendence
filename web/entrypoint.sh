#!/bin/sh
set -e

npm run watch & # Start the watch process in the background
npm run copy-assets # Copy assets to the public directory