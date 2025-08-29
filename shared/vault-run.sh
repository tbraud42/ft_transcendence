#!/bin/sh
# vault-run.sh — robust .env loader for Vault Agent rendered files
# DEBUG=1 will enable verbose prints

set -eu

DEBUG="${DEBUG:-0}"

log() {
  if [ "$DEBUG" = "1" ]; then
    echo "[vault-run] $*" >&2
  fi
}

ENV_PATH="${1:?error: env file path is required, e.g. /secrets/svc/app.env}"
shift || true

WAIT_TIMEOUT="${WAIT_TIMEOUT:-60}"

start_ts=$(date +%s 2>/dev/null || echo 0)
while [ ! -s "$ENV_PATH" ]; do
  log "Waiting for $ENV_PATH..."
  sleep 1
  if [ "${WAIT_TIMEOUT}" -gt 0 ]; then
    now=$(date +%s 2>/dev/null || echo 0)
    elapsed=$((now - start_ts))
    if [ "$elapsed" -ge "${WAIT_TIMEOUT}" ]; then
      echo "error: timed out waiting for $ENV_PATH (WAIT_TIMEOUT=${WAIT_TIMEOUT}s)" >&2
      exit 1
    fi
  fi
done
log "Found env file: $ENV_PATH"

strip_bom() {
  printf '%s' "$1" | awk 'BEGIN{ORS=""}{if(NR==1){sub(/^\xEF\xBB\xBF/,"")}print}'
}
trim() {
  printf '%s' "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}
is_valid_key() {
  printf '%s' "$1" | grep -Eq '^[A-Za-z_][A-Za-z0-9_]*$'
}

first_line=1
while IFS= read -r raw || [ -n "$raw" ]; do
  line=$(printf '%s' "$raw" | tr -d '\r')
  if [ "$first_line" -eq 1 ]; then
    line=$(strip_bom "$line")
    first_line=0
  fi
  line=$(trim "$line")

  [ -z "$line" ] && { log "skip: empty line"; continue; }
  case "$line" in \#*) log "skip: comment: $line"; continue ;; esac

  # optional "export "
  case "$line" in
    export[[:space:]]*)
      log "strip export prefix: $line"
      line=$(printf '%s' "$line" | sed 's/^export[[:space:]]\+//')
      ;;
  esac

  case "$line" in
    *=*) ;; 
    *:*) 
      log "convert ':' -> '=': $line"
      line=${line/:/=} ;;
  esac

  case "$line" in
    *=*)
      key=${line%%=*}
      val=${line#*=}
      key=$(trim "$key")

      # strip quotes if matching
      case "$val" in
        \"*\"|\'*\')
          q1=$(printf '%s' "$val" | cut -c1)
          qn=$(printf '%s' "$val" | awk '{print substr($0,length,1)}')
          if [ "$q1" = "$qn" ]; then
            log "strip quotes around value for $key"
            val=$(printf '%s' "$val" | sed 's/^.\(.*\).$/\1/')
          fi
          ;;
      esac

      if is_valid_key "$key"; then
        log "export $key=${val}"
        export "${key}=${val}"
      else
        log "invalid key ignored: $key"
      fi
      ;;
    *)
      log "malformed line ignored: $line"
      ;;
  esac
done < "$ENV_PATH"

log "Executing command: $*"
exec "$@"
