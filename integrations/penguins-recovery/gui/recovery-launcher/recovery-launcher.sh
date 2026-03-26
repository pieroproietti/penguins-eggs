#!/bin/bash
# recovery-launcher.sh -- Start the Penguins-Recovery QML launcher.
#
# Attempts to use qmlscene (Qt5) or qml (Qt6) to run the launcher.
# Falls back to a simple terminal menu if no Qt runtime is available.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QML_MAIN="$SCRIPT_DIR/qml/main.qml"

# Try Qt6 first, then Qt5
if command -v qml6 &>/dev/null; then
    exec qml6 "$QML_MAIN"
elif command -v qmlscene &>/dev/null; then
    exec qmlscene "$QML_MAIN"
elif command -v qml &>/dev/null; then
    exec qml "$QML_MAIN"
else
    echo "No QML runtime found. Falling back to terminal menu."
    echo ""
    echo "=== Penguins-Recovery ==="
    echo ""
    echo "Available tools:"
    echo "  1) Restore GRUB          (grub-restore.sh)"
    echo "  2) UEFI Boot Repair      (uefi-repair.sh)"
    echo "  3) Detect Disks          (detect-disks.sh)"
    echo "  4) Chroot Rescue         (chroot-rescue.sh)"
    echo "  5) Reset Password        (password-reset.sh)"
    echo "  6) Terminal              (bash)"
    echo "  7) Exit"
    echo ""

    while true; do
        read -rp "Select [1-7]: " choice
        case "$choice" in
            1) sudo /usr/local/bin/grub-restore.sh ;;
            2) sudo /usr/local/bin/uefi-repair.sh ;;
            3) sudo /usr/local/bin/detect-disks.sh ;;
            4) sudo /usr/local/bin/chroot-rescue.sh ;;
            5) sudo /usr/local/bin/password-reset.sh ;;
            6) bash ;;
            7) exit 0 ;;
            *) echo "Invalid selection." ;;
        esac
        echo ""
    done
fi
