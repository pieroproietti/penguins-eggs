#!/usr/bin/env bash
# integration/eggs-plugin/powerwash-hook.sh
#
# Called by penguins-eggs during ISO creation.
#
# Environment variables set by penguins-eggs:
#   EGGS_WORK       -- working directory for ISO assembly
#   EGGS_ISO_ROOT   -- root of the ISO filesystem being built
#   EGGS_HOOK       -- hook point: "produce" | "update"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PW_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

EGGS_ISO_ROOT="${EGGS_ISO_ROOT:?EGGS_ISO_ROOT must be set by penguins-eggs}"

case "${EGGS_HOOK:-produce}" in

  produce)
    # eggs fires this hook twice:
    #   pre-produce:  EGGS_ISO_ROOT=/  EGGS_ISO_FILE=""   → liveroot not yet mounted
    #   post-produce: EGGS_ISO_ROOT=<liveroot> EGGS_ISO_FILE=<path.iso>
    #
    # Powerwash copies binaries into the live filesystem, so it must run
    # post-produce (after bindLiveFs has populated liveroot). Skip pre-produce.
    if [[ -z "${EGGS_ISO_FILE:-}" ]]; then
      exit 0
    fi

    echo "[penguins-powerwash] Embedding powerwash into ISO..."

    # 1. Copy the penguins-powerwash binary and libraries into the ISO
    PW_DEST="${EGGS_ISO_ROOT}/usr/local/bin"
    PW_LIB_DEST="${EGGS_ISO_ROOT}/usr/local/lib/penguins-powerwash"
    PW_PLUGIN_DEST="${EGGS_ISO_ROOT}/usr/local/lib/penguins-powerwash/plugins"
    mkdir -p "${PW_DEST}" "${PW_LIB_DEST}" "${PW_PLUGIN_DEST}"

    install -m 0755 "${PW_ROOT}/bin/penguins-powerwash" "${PW_DEST}/penguins-powerwash"
    cp -r "${PW_ROOT}/lib/"*.sh "${PW_LIB_DEST}/"
    cp -r "${PW_ROOT}/modes/"  "${PW_LIB_DEST}/modes/"
    cp -r "${PW_ROOT}/plugins/" "${PW_PLUGIN_DEST}/"

    # 2. Add a GRUB factory-reset menu entry
    GRUB_CFG="${EGGS_ISO_ROOT}/boot/grub/grub.cfg"
    if [[ -f "${GRUB_CFG}" ]] && ! grep -q "penguins-powerwash" "${GRUB_CFG}"; then
      cat >> "${GRUB_CFG}" << 'GRUB'

menuentry "Factory Reset (penguins-powerwash hard)" --class reset {
    linux   /boot/vmlinuz quiet splash penguins.powerwash=hard
    initrd  /boot/initrd.img
}
GRUB
      echo "[penguins-powerwash] Added factory-reset GRUB entry."
    fi

    echo "[penguins-powerwash] Embedded into ISO."
    ;;

  update)
    echo "[penguins-powerwash] Nothing to do on eggs update."
    ;;

esac
