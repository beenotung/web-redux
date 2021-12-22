#!/bin/bash
set -e
set -o pipefail

pwd="$PWD"

cd "$pwd/lib/web-redux-core" && npm run build
cd "$pwd/lib/web-redux-server" && npm run build
cd "$pwd/lib/web-redux-client" && npm run build

cd "$pwd/example/common" && npm run build
cd "$pwd/example/server" && npm run build
cd "$pwd/example/react-app" && npm run build
