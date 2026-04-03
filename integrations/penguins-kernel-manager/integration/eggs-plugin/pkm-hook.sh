#!/usr/bin/env bash
# integration/eggs-plugin/pkm-hook.sh
#
# Called by penguins-eggs during ISO creation and system update.
#
# Environment variables set by penguins-eggs:
#   EGGS_WORK       -- working directory for ISO assembly
#   EGGS_ISO_ROOT   -- root of the ISO filesystem being built
#   EGGS_HOOK       -- which hook point triggered this script:
#                      "produce"  (ISO build)
#                      "update"   (eggs update)
#                      "kernel-changed"  (post-install notification)

set -euo pipefail

PKM_BIN="${PKM_BIN:-penguins-kernel-manager}"

_pkm_available() { command -v "${PKM_BIN}" &>/dev/null; }

case "${EGGS_HOOK:-produce}" in

  produce)
    # Embed the list of installed/held kernels as a manifest so penguins-recovery
    # knows which kernel to restore.
    #
    # eggs fires this hook twice:
    #   pre-produce:  EGGS_ISO_ROOT=/  EGGS_ISO_FILE=""   → write to real system
    #   post-produce: EGGS_ISO_ROOT=<liveroot> EGGS_ISO_FILE=<path.iso>
    #
    # We only need to write once (pre-produce), so skip when EGGS_ISO_FILE is set.
    if [[ -n "${EGGS_ISO_FILE:-}" ]]; then
      exit 0
    fi
    if _pkm_available && [[ -n "${EGGS_ISO_ROOT:-}" ]]; then
      MANIFEST_DIR="${EGGS_ISO_ROOT}/etc/penguins-kernel-manager"
      mkdir -p "${MANIFEST_DIR}"
      "${PKM_BIN}" list --installed --json > "${MANIFEST_DIR}/kernel-manifest.json" 2>/dev/null || true
      echo "[penguins-kernel-manager] Kernel manifest written to ${MANIFEST_DIR}."
    fi
    ;;

  update)
    # Warn if any held kernels would be skipped by eggs update.
    if _pkm_available; then
      HELD=$("${PKM_BIN}" list --installed --json 2>/dev/null \
             | python3 -c "import sys,json; \
               data=json.load(sys.stdin); \
               [print(k['version']) for k in data if k.get('held')]" 2>/dev/null || true)
      if [[ -n "${HELD}" ]]; then
        echo "[penguins-kernel-manager] WARNING: held kernels will not be updated: ${HELD}"
      fi
    fi
    ;;

  kernel-changed)
    # Triggered by pkm post-install hook. Log the event for eggs.
    echo "[penguins-kernel-manager] Kernel change detected — next 'eggs produce' will pick up the new kernel."
    ;;

esac
