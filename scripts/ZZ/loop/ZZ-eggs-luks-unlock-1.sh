#!/bin/sh
# Questo è lo SCRIPT RUNTIME (in live-premount)
# v21 - No Cleanup, Direct Mount

set -e

# --- Logging Setup ---
LOGFILE="/tmp/eggs-premount.log"
FIFO="/tmp/eggs-log.fifo"
rm -f "$LOGFILE" "$FIFO"
if ! mkfifo "$FIFO"; then echo "EGGS: FATALE: Impossibile creare FIFO $FIFO"; exit 1; fi
tee -a "$LOGFILE" < "$FIFO" &
TEE_PID=$!
exec > "$FIFO" 2>&1
trap 'echo "EGGS: Chiusura log e pulizia FIFO..."; rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null; exit' EXIT INT TERM
# --- Logging End ---

echo "EGGS: LOGGING avviato su $LOGFILE"
echo "EGGS: script (v21 - No Cleanup, Direct Mount) in live-premount partito."
sleep 5

# 1. Trova live media
echo "EGGS: Ricerca live media..."
mkdir -p /mnt/live-media /mnt/ext4
LIVE_DEV=""
# ... [Codice ricerca live media come prima, magari meno verboso] ...
MAX_WAIT_DEV=20; COUNT_DEV=0
while [ -z "$LIVE_DEV" ] && [ $COUNT_DEV -lt $MAX_WAIT_DEV ]; do
    ls /dev > /dev/null
    for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do
        if [ ! -b "$dev" ]; then continue; fi
        if mount -o ro "$dev" /mnt/live-media 2>/dev/null; then
            if [ -f /mnt/live-media/live/root.img ]; then
                echo "EGGS: Found Live media on $dev"
                LIVE_DEV=$dev; break 2
            else
                umount /mnt/live-media 2>/dev/null
            fi
        fi
    done
    sleep 1; COUNT_DEV=$((COUNT_DEV+1))
done
if [ -z "$LIVE_DEV" ]; then echo "EGGS: ERRORE FINALE: Impossibile trovare live media dopo $MAX_WAIT_DEV sec."; ls /dev; exit 1; fi

ROOT_IMG_RO="/mnt/live-media/live/root.img"

# 2. Sblocca LUKS
echo "EGGS: In attesa della passphrase per sbloccare $ROOT_IMG_RO..."
if ! cryptsetup open "$ROOT_IMG_RO" live-root; then echo "EGGS: ERRORE: Sblocco LUKS fallito."; exit 1; fi
echo "EGGS: LUKS sbloccato. Attesa per /dev/mapper/live-root..."

MAX_WAIT_MAP=10; COUNT_MAP=0
while [ ! -b /dev/mapper/live-root ] && [ $COUNT_MAP -lt $MAX_WAIT_MAP ]; do
    echo "EGGS: Aspetto /dev/mapper/live-root... ($COUNT_MAP/$MAX_WAIT_MAP)"; sleep 1; COUNT_MAP=$((COUNT_MAP+1))
done
if [ ! -b /dev/mapper/live-root ]; then echo "EGGS: ERRORE: Device /dev/mapper/live-root non apparso dopo $MAX_WAIT_MAP sec."; ls /dev/mapper; cryptsetup close live-root || true; exit 1; fi
echo "EGGS: Device mapper pronto."

# 3. Monta l'ext4 (ro)
mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4
echo "EGGS: /dev/mapper/live-root montato su /mnt/ext4 (ro)."

# 4. Monta lo squashfs sulla destinazione finale (ro)
echo "EGGS: Controllo variabile rootmnt: '${rootmnt}'"
if [ -z "${rootmnt}" ]; then echo "EGGS: ERRORE: La variabile \$rootmnt non è definita!"; exit 1; fi
if [ ! -d "${rootmnt}" ]; then echo "EGGS: ERRORE: La directory '${rootmnt}' non esiste!"; ls /; exit 1; fi
echo "EGGS: Montaggio filesystem.squashfs su ${rootmnt} (ro)..."
if ! mount -t squashfs -o ro,loop /mnt/ext4/filesystem.squashfs "${rootmnt}"; then
     echo "EGGS: ERRORE: mount -o ro,loop /mnt/ext4/filesystem.squashfs ${rootmnt} FALLITO!"; exit 1
fi
echo "EGGS: SquashFS montato con successo (ro)."
echo "EGGS: Verifica mount finale:"
mount | grep "${rootmnt}" # Logga la riga di mount per conferma

# 5. Passa il testimone a live-boot
echo "EGGS: Esporto ROOT_MOUNTED=true..."
export ROOT_MOUNTED=true # Questa variabile potrebbe essere cruciale per live-boot
echo "EGGS: Fatto. rootfs pronto, avvio del sistema."
echo "EGGS: Log completo salvato in $LOGFILE (in initramfs)."

exit 0