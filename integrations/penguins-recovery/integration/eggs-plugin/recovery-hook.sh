#!/bin/bash
# recovery-hook.sh -- Called by penguins-eggs during ISO creation to embed
# recovery tools into the generated live image.
#
# Environment variables set by penguins-eggs:
#   EGGS_WORK     -- Working directory for ISO assembly
#   EGGS_ISO_ROOT -- Root of the ISO filesystem being built
#   EGGS_DISTRO   -- Target distribution family (debian, arch, etc.)
#
# This script:
#   1. Copies shared rescue scripts into the ISO
#   2. Adds a recovery GRUB menu entry
#   3. Optionally includes the recovery-manager binary

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECOVERY_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

EGGS_ISO_ROOT="${EGGS_ISO_ROOT:?EGGS_ISO_ROOT must be set by penguins-eggs}"

echo "[penguins-recovery] Embedding recovery tools into ISO..."

# 1. Copy shared rescue scripts
SCRIPTS_DEST="${EGGS_ISO_ROOT}/usr/local/bin"
mkdir -p "$SCRIPTS_DEST"
cp "${RECOVERY_ROOT}/common/scripts/chroot-rescue.sh" "$SCRIPTS_DEST/"
cp "${RECOVERY_ROOT}/common/scripts/detect-disks.sh" "$SCRIPTS_DEST/"
chmod +x "$SCRIPTS_DEST"/*.sh

# 2. Copy MOTD
MOTD_DEST="${EGGS_ISO_ROOT}/etc"
if [ -f "${RECOVERY_ROOT}/common/branding/motd.txt" ]; then
    cp "${RECOVERY_ROOT}/common/branding/motd.txt" "${MOTD_DEST}/motd"
fi

# 3. Add GRUB recovery entry if GRUB config exists
GRUB_CFG="${EGGS_ISO_ROOT}/boot/grub/grub.cfg"
if [ -f "$GRUB_CFG" ]; then
    if ! grep -q "Penguins-Recovery" "$GRUB_CFG"; then
        cat "${SCRIPT_DIR}/grub-entry.cfg" >> "$GRUB_CFG"
        echo "[penguins-recovery] Added recovery GRUB menu entry."
    fi
fi

echo "[penguins-recovery] Recovery tools embedded."
