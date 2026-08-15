#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
adb_path="${APP_RELAX_ADB:-/Users/RF/Library/Android/sdk/platform-tools/adb}"
package_name="com.robertfultonstudio.apprelax"
development_apk="$project_root/dist/eas/app-relax-development-android-73cd8dfc.apk"
development_apk_hash="d54a5333b40574baeb6560879a743ad1722619df6f6c676669e62bf7feff4ae7"
codex_node="/Users/RF/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
codex_pnpm="/Users/RF/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm"
node_path="${APP_RELAX_NODE:-$codex_node}"
pnpm_path="${APP_RELAX_PNPM:-$codex_pnpm}"

usage() {
  cat <<'EOF'
Uso: bash scripts/android-physical-device.sh <comando>

  check     Verifica ADB, APK e collegamento del telefono.
  info      Mostra modello, Android, ABI, memoria e risoluzione del telefono.
  install   Installa/aggiorna il Dev Client esistente senza cancellarne i dati.
  reverse   Collega la porta USB del telefono a Metro su localhost:8081.
  metro     Avvia Metro per la sorgente M2 corrente (Ctrl-C per fermarlo).
  open      Apre il Dev Client e gli passa l'indirizzo Metro locale.
  logs      Mostra i log dell'app in tempo reale (Ctrl-C per fermarli).
  cleanup   Ferma l'app, rimuove il reverse e spegne il server ADB.

Variabili facoltative:
  APP_RELAX_ANDROID_SERIAL  seriale ADB, utile se sono collegati piu device
  APP_RELAX_ADB             percorso alternativo di adb
  APP_RELAX_NODE            percorso alternativo di Node >=22.13
  APP_RELAX_PNPM            percorso alternativo di pnpm
EOF
}

fail() {
  printf 'ERRORE: %s\n' "$*" >&2
  exit 1
}

require_file() {
  local path="$1"
  local label="$2"
  [[ -f "$path" ]] || fail "$label non trovato: $path"
}

require_executable() {
  local path="$1"
  local label="$2"
  [[ -x "$path" ]] || fail "$label non eseguibile: $path"
}

verify_development_apk() {
  local actual_hash

  require_file "$development_apk" "Dev Client APK"
  actual_hash="$(shasum -a 256 "$development_apk" | awk '{ print $1 }')"
  [[ "$actual_hash" == "$development_apk_hash" ]] ||
    fail "hash Dev Client inatteso: $actual_hash"
}

adb_target() {
  if [[ -n "${APP_RELAX_ANDROID_SERIAL:-}" ]]; then
    "$adb_path" -s "$APP_RELAX_ANDROID_SERIAL" "$@"
  else
    "$adb_path" -d "$@"
  fi
}

physical_devices() {
  "$adb_path" devices | awk 'NR > 1 && $2 == "device" && $1 !~ /^emulator-/ { print $1 }'
}

require_physical_device() {
  local devices
  local count

  devices="$(physical_devices)"
  count="$(printf '%s\n' "$devices" | awk 'NF { count += 1 } END { print count + 0 }')"

  if [[ -n "${APP_RELAX_ANDROID_SERIAL:-}" ]]; then
    "$adb_path" -s "$APP_RELAX_ANDROID_SERIAL" get-state >/dev/null 2>&1 ||
      fail "il device $APP_RELAX_ANDROID_SERIAL non e disponibile o autorizzato"
    return
  fi

  if [[ "$count" -eq 0 ]]; then
    "$adb_path" devices -l
    fail "nessun telefono Android autorizzato. Collega il cavo dati, attiva Debug USB e accetta la chiave RSA sul telefono"
  fi

  if [[ "$count" -gt 1 ]]; then
    "$adb_path" devices -l
    fail "piu telefoni rilevati. Imposta APP_RELAX_ANDROID_SERIAL con il seriale scelto"
  fi
}

show_info() {
  printf 'Modello: %s %s\n' \
    "$(adb_target shell getprop ro.product.manufacturer | tr -d '\r')" \
    "$(adb_target shell getprop ro.product.model | tr -d '\r')"
  printf 'Android: %s (API %s)\n' \
    "$(adb_target shell getprop ro.build.version.release | tr -d '\r')" \
    "$(adb_target shell getprop ro.build.version.sdk | tr -d '\r')"
  printf 'ABI: %s\n' "$(adb_target shell getprop ro.product.cpu.abi | tr -d '\r')"
  printf 'Risoluzione: %s\n' "$(adb_target shell wm size | tr -d '\r')"
  printf 'Densita: %s\n' "$(adb_target shell wm density | tr -d '\r')"
  printf 'Memoria: %s\n' "$(adb_target shell awk '/MemTotal/ { print $2 " kB"; exit }' /proc/meminfo | tr -d '\r')"
}

if [[ "${1:-}" == "--" ]]; then
  shift
fi

command="${1:-help}"

case "$command" in
  help|-h|--help)
    usage
    ;;
  check)
    require_executable "$adb_path" "ADB"
    verify_development_apk
    "$adb_path" version | sed -n '1,3p'
    printf 'APK Dev Client: %s\n' "$development_apk"
    printf 'SHA-256 verificato: %s\n' "$development_apk_hash"
    require_physical_device
    show_info
    ;;
  info)
    require_executable "$adb_path" "ADB"
    require_physical_device
    show_info
    ;;
  install)
    require_executable "$adb_path" "ADB"
    verify_development_apk
    require_physical_device
    adb_target install -r "$development_apk"
    adb_target reverse tcp:8081 tcp:8081
    printf 'Dev Client installato. Ora avvia Metro in un terminale separato.\n'
    ;;
  reverse)
    require_executable "$adb_path" "ADB"
    require_physical_device
    adb_target reverse tcp:8081 tcp:8081
    adb_target reverse --list
    ;;
  metro)
    require_executable "$node_path" "Node"
    require_executable "$pnpm_path" "pnpm"
    [[ -d "$project_root/node_modules" ]] ||
      fail "node_modules assente; l'installazione dipendenze e un gate separato"
    export PATH="$(dirname "$node_path"):$(dirname "$pnpm_path"):$PATH"
    cd "$project_root"
    printf 'Node: %s\n' "$($node_path --version)"
    printf 'Metro: http://127.0.0.1:8081 (Ctrl-C per fermare)\n'
    exec "$pnpm_path" exec expo start --dev-client --localhost --port 8081
    ;;
  open)
    require_executable "$adb_path" "ADB"
    require_physical_device
    adb_target reverse tcp:8081 tcp:8081
    if ! adb_target shell am start -W \
      -a android.intent.action.VIEW \
      -d 'exp+app-relax://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081' \
      "$package_name"; then
      adb_target shell monkey -p "$package_name" -c android.intent.category.LAUNCHER 1
    fi
    ;;
  logs)
    require_executable "$adb_path" "ADB"
    require_physical_device
    app_pid="$(adb_target shell pidof "$package_name" | tr -d '\r')"
    [[ -n "$app_pid" ]] || fail "app non in esecuzione; avviala prima con il comando open"
    printf 'Log PID %s (Ctrl-C per fermare)\n' "$app_pid"
    if [[ -n "${APP_RELAX_ANDROID_SERIAL:-}" ]]; then
      exec "$adb_path" -s "$APP_RELAX_ANDROID_SERIAL" logcat -v color --pid="$app_pid"
    else
      exec "$adb_path" -d logcat -v color --pid="$app_pid"
    fi
    ;;
  cleanup)
    require_executable "$adb_path" "ADB"
    if adb_target get-state >/dev/null 2>&1; then
      adb_target shell am force-stop "$package_name" || true
      adb_target reverse --remove tcp:8081 || true
    fi
    "$adb_path" kill-server || true
    printf 'App fermata, reverse rimosso e server ADB spento.\n'
    ;;
  *)
    usage >&2
    fail "comando sconosciuto: $command"
    ;;
esac
