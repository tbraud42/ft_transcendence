#!/bin/sh
set -eu

ENV_PATH="${1:?error env path is empty}"
shift || true

# Attendre que le fichier soit non-vide
until [ -s "$ENV_PATH" ]; do
  echo "Waiting for $ENV_PATH from Vault Agent..."
  sleep 1
done

while IFS= read -r raw || [ -n "$raw" ]; do
  # strip CR, trim
  line=$(printf '%s' "$raw" | tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  [ -z "$line" ] && continue
  case "$line" in \#*) continue ;; esac

  # Tolérer KEY:VALUE (convertir le 1er ":" en "=")
  case "$line" in
    *=*) ;;            # OK
    *:*) line=${line/:/=} ;;
  esac

  case "$line" in
    *=*)
      key=${line%%=*}
      val=${line#*=}
      # Valider un nom de var POSIX
      if printf '%s' "$key" | grep -Eq '^[A-Za-z_][A-Za-z0-9_]*$'; then
        export "$key=$val"
      else
        echo "ignore bad key: $key" >&2
      fi
      ;;
    *)
      echo "ignore malformed line: $line" >&2
      ;;
  esac
done < "$ENV_PATH"

exec "$@"
