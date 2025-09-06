#!/bin/sh
# This file here parse and export env variables from /secret/../app.env created by vault-agent

set -eu

ENV_PATH="${1:?error: env file path is required, e.g. /secrets/service/app.env}"
shift || true

WAIT_TIMEOUT="${WAIT_TIMEOUT:-60}"

start_ts=$(date +%s 2>/dev/null || echo 0)
while [ ! -s "$ENV_PATH" ]; do
  echo "Waiting for $ENV_PATH..."
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

  [ -z "$line" ] && continue;
  case "$line" in \#*) continue ;; esac

  case "$line" in
    *=*) ;; 
    *:*) 
      line=${line/:/=} ;;
  esac

  case "$line" in
    *=*)
      key=${line%%=*}
      val=${line#*=}
      key=$(trim "$key")

      case "$val" in
        \"*\"|\'*\')
          q1=$(printf '%s' "$val" | cut -c1)
          qn=$(printf '%s' "$val" | awk '{print substr($0,length,1)}')
          if [ "$q1" = "$qn" ]; then
            val=$(printf '%s' "$val" | sed 's/^.\(.*\).$/\1/')
          fi
          ;;
      esac

      if is_valid_key "$key"; then
        export "${key}=${val}"
      fi
      ;;
    *)
      ;;
  esac
done < "$ENV_PATH"

exec "$@"
