#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'HELP'
Usage: ./script/build_and_run.sh [--ios|--android|--web|--dev-client|--tunnel|--export-web|--help]

Starts the Expo development server by default.
HELP
}

runner="npx expo"

case "${1:-}" in
  --help|-h)
    show_help
    ;;
  --ios)
    $runner start --ios
    ;;
  --android)
    $runner start --android
    ;;
  --web)
    $runner start --web
    ;;
  --dev-client)
    $runner start --dev-client
    ;;
  --tunnel)
    $runner start --tunnel
    ;;
  --export-web)
    $runner export --platform web
    ;;
  "")
    $runner start
    ;;
  *)
    echo "Unknown option: $1" >&2
    show_help
    exit 1
    ;;
esac
