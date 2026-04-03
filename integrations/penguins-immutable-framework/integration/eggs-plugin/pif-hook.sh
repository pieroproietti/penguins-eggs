#!/usr/bin/env bash
# integration/eggs-plugin/pif-hook.sh
#
# Called by penguins-eggs at several hook points.
#
# Environment variables set by penguins-eggs or pif:
#   EGGS_WORK       -- working directory for ISO assembly
#   EGGS_ISO_ROOT   -- root of the ISO filesystem being built
#   EGGS_HOOK       -- hook point:
#                      "produce"          (eggs produce)
#                      "update"           (eggs update)
#                      "pif-upgraded"     (pif post-upgrade notification)
#                      "pif-mutable-enter"(pif entered mutable mode)
#                      "pif-mutable-exit" (pif exited mutable mode)
#   PIF_BACKEND     -- active backend name (set by pif on pif-upgraded)

set -euo pipefail

PIF_BIN="${PIF_BIN:-pif}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC2034  # PIF_ROOT is available to hook cases that need it
PIF_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

case "${EGGS_HOOK:-produce}" in

  produce)
    # Embed the PIF config and backend state so recovery tools know which
    # backend was active when the ISO was built.
    #
    # eggs fires this hook twice:
    #   pre-produce:  EGGS_ISO_ROOT=/  EGGS_ISO_FILE=""   → write to real system
    #   post-produce: EGGS_ISO_ROOT=<liveroot> EGGS_ISO_FILE=<path.iso>
    #
    # We only need to write once (pre-produce), so skip when EGGS_ISO_FILE is set.
    if [[ -n "${EGGS_ISO_FILE:-}" ]]; then
      exit 0
    fi
    if [[ -n "${EGGS_ISO_ROOT:-}" ]]; then
      PIF_CONF_DEST="${EGGS_ISO_ROOT}/etc/penguins-immutable-framework"
      mkdir -p "${PIF_CONF_DEST}"

      # Copy the active config if present
      for cfg in /etc/pif/pif.toml ~/.config/pif/pif.toml; do
        if [[ -f "${cfg}" ]]; then
          cp "${cfg}" "${PIF_CONF_DEST}/pif.toml"
          break
        fi
      done

      # Write a backend-state snapshot
      if command -v "${PIF_BIN}" &>/dev/null; then
        "${PIF_BIN}" status --json > "${PIF_CONF_DEST}/backend-state.json" 2>/dev/null || true
      fi

      echo "[penguins-immutable-framework] PIF state embedded into ${PIF_CONF_DEST}."
    fi
    ;;

  update)
    # Refuse to update if the system is currently in mutable mode
    if command -v "${PIF_BIN}" &>/dev/null; then
      STATUS=$("${PIF_BIN}" status --json 2>/dev/null)
      MUTABLE=$(echo "${STATUS}" | python3 -c \
        "import sys,json; d=json.load(sys.stdin); print(d.get('mutable', False))" 2>/dev/null || echo "False")
      if [[ "${MUTABLE}" == "True" ]]; then
        echo "[penguins-immutable-framework] WARNING: system is in mutable mode. Run 'pif mutable exit' before eggs update."
        exit 1
      fi
    fi
    ;;

  pif-upgraded)
    echo "[penguins-immutable-framework] Backend '${PIF_BACKEND:-unknown}' upgraded — next 'eggs produce' will embed the new root."
    ;;

  pif-mutable-enter)
    echo "[penguins-immutable-framework] WARNING: system entered mutable mode. Defer 'eggs produce' until 'pif mutable exit'."
    ;;

  pif-mutable-exit)
    echo "[penguins-immutable-framework] System returned to immutable mode."
    ;;

esac
