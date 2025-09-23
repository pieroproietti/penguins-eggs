# Esci immediatamente se un comando fallisce
set -e

# Il percorso del VERO comando update-initramfs, non il wrapper del sistema Live
REAL_UPDATE_INITRAMFS="/usr/sbin/update-initramfs.orig.initramfs-tools"

echo "DEBUG: Bypassing live-boot wrapper. Calling the original update-initramfs directly."

# Esegui il comando originale per creare l'initramfs per tutti i kernel.
# L'opzione '-c' sta per 'create'.
"$REAL_UPDATE_INITRAMFS" -c -k all

echo "DEBUG: Original update-initramfs executed successfully."

exit 0