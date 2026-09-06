#!/bin/bash
set -eu

task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$task_root"
task_version="$(tr -d '\r\n' < .nvmrc)"
task_node="$HOME/.nvm/versions/node/v${task_version}/bin/node"

if [ ! -x "$task_node" ]; then
  printf 'Non trovo Node %s già installato sul Mac. Non è stata eseguita alcuna installazione.\n' "$task_version"
  exit 1
fi

exec "$task_node" "$task_root/scripts/start-pwa-web-preview.mjs" "$@"
