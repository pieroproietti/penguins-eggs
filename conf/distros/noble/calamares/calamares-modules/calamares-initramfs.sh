#!/bin/bash

# Abilita il debug (stampa ogni comando) e l'uscita immediata in caso di errore.
# Questa è la modifica più importante.
set -ex

LIVE_HOOK="/usr/share/initramfs-tools/hooks/live"
BACKUP_PATH="/tmp/live.hook.bak"

echo "DEBUG: Starting custom initramfs script in debug mode."

if [ -f "$LIVE_HOOK" ]; then
    echo "DEBUG: Found live hook at $LIVE_HOOK. Attempting to move it."
    # Se questo comando fallisce, lo script si fermerà qui grazie a 'set -e'
    mv "$LIVE_HOOK" "$BACKUP_PATH"
    echo "DEBUG: live hook moved successfully to $BACKUP_PATH."
else
    echo "DEBUG: live hook not found, proceeding without moving."
fi

echo "DEBUG: Running update-initramfs..."
update-initramfs -c -k all
echo "DEBUG: update-initramfs finished successfully."

if [ -f "$BACKUP_PATH" ]; then
    echo "DEBUG: Restoring live hook from $BACKUP_PATH."
    mv "$BACKUP_PATH" "$LIVE_HOOK"
    echo "DEBUG: live hook restored."
fi

echo "DEBUG: Custom initramfs script finished successfully."
exit 0