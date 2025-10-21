#!/bin/sh
# Questo è lo SCRIPT RUNTIME (in live-premount)
# v22 - Copy to RAM

set -e

# --- INIZIO BLOCCO LOGGING ---
LOGFILE="/tmp/eggs-premount.log"
FIFO="/tmp/eggs-log.fifo"
rm -f "$LOGFILE" "$FIFO"
if ! mkfifo "$FIFO"; then echo "EGGS: FATALE: Impossibile creare FIFO $FIFO"; exit 1; fi
tee -a "$LOGFILE" < "$FIFO" &
TEE_PID=$!
exec > "$FIFO" 2>&1
trap 'echo "EGGS: Chiusura log e pulizia FIFO..."; rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null; exit' EXIT INT TERM
# --- FINE BLOCCO LOGGING ---

echo "EGGS: LOGGING avviato su $LOGFILE"
echo "EGGS: script (v22 - Copy to RAM) in live-premount partito."
echo "EGGS: Assumo che udev e /dev siano pronti..."
sleep 5

# 1. Trova live media
echo "EGGS: Ricerca live media..."
mkdir -p /mnt/live-media || echo "EGGS: ERRORE mkdir /mnt/live-media"
mkdir -p /mnt/ext4 || echo "EGGS: ERRORE mkdir /mnt/ext4"
LIVE_DEV=""
MAX_WAIT_DEV=20
COUNT_DEV=0
while [ -z "$LIVE_DEV" ] && [ $COUNT_DEV -lt $MAX_WAIT_DEV ]; do
    ls /dev > /dev/null
    for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do
        if [ ! -b "$dev" ]; then continue; fi
        if mount -o ro "$dev" /mnt/live-media 2>/dev/null; then
            if [ -f /mnt/live-media/live/root.img ]; then
                echo "EGGS: Found Live media on $dev"
                LIVE_DEV=$dev
                break 2
            else
                umount /mnt/live-media 2>/dev/null
            fi
        fi
    done
    sleep 1
    COUNT_DEV=$((COUNT_DEV+1))
done

if [ -z "$LIVE_DEV" ]; then
    echo "EGGS: ERRORE FINALE: Impossibile trovare live media dopo $MAX_WAIT_DEV sec."
    ls /dev
    exit 1
fi

ROOT_IMG_RO="/mnt/live-media/live/root.img"

# 2. Sblocca LUKS
echo "EGGS: In attesa della passphrase per sbloccare $ROOT_IMG_RO..."
if ! cryptsetup open "$ROOT_IMG_RO" live-root; then # Potresti aggiungere --readonly
    echo "EGGS: ERRORE: Sblocco LUKS fallito."
    exit 1
fi
echo "EGGS: LUKS sbloccato. Attesa per /dev/mapper/live-root..."

MAX_WAIT_MAP=10
COUNT_MAP=0
while [ ! -b /dev/mapper/live-root ] && [ $COUNT_MAP -lt $MAX_WAIT_MAP ]; do
    echo "EGGS: Aspetto /dev/mapper/live-root... ($COUNT_MAP/$MAX_WAIT_MAP)"
    sleep 1
    COUNT_MAP=$((COUNT_MAP+1))
done

if [ ! -b /dev/mapper/live-root ]; then
    echo "EGGS: ERRORE: Device /dev/mapper/live-root non apparso dopo $MAX_WAIT_MAP sec."
    ls /dev/mapper
    cryptsetup close live-root || true
    exit 1
fi
echo "EGGS: Device mapper pronto."

# 3. Monta l'ext4 (ro)
mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4
echo "EGGS: /dev/mapper/live-root montato su /mnt/ext4 (ro)."

SQUASHFS_SRC="/mnt/ext4/filesystem.squashfs"
# La destinazione standard in RAM che live-boot controlla
SQUASHFS_DEST_DIR="/run/live/medium"
SQUASHFS_DEST="${SQUASHFS_DEST_DIR}/filesystem.squashfs"

# 4. Copia lo SquashFS in RAM
echo "EGGS: Controllo esistenza ${SQUASHFS_SRC}..."
if [ ! -f "$SQUASHFS_SRC" ]; then
    echo "EGGS: ERRORE: ${SQUASHFS_SRC} non trovato!"
    ls /mnt/ext4
    umount /mnt/ext4 || true
    cryptsetup close live-root || true
    umount /mnt/live-media || true
    exit 1
fi

echo "EGGS: Creazione directory destinazione ${SQUASHFS_DEST_DIR}..."
mkdir -p "$SQUASHFS_DEST_DIR" || echo "EGGS: ERRORE mkdir ${SQUASHFS_DEST_DIR}"

echo "EGGS: Copia di ${SQUASHFS_SRC} in ${SQUASHFS_DEST} (RAM)..."
# Usiamo 'cp' semplice, assume ci sia abbastanza RAM.
# Per sistemi con poca RAM, questo potrebbe fallire.
if ! cp "$SQUASHFS_SRC" "$SQUASHFS_DEST"; then
    echo "EGGS: ERRORE: Copia di filesystem.squashfs in RAM fallita!"
    # Potrebbe essere per spazio insufficiente in tmpfs (/run)
    df -h # Mostra spazio dischi (incluso tmpfs)
    umount /mnt/ext4 || true
    cryptsetup close live-root || true
    umount /mnt/live-media || true
    exit 1
fi
echo "EGGS: Copia completata."

# 5. Pulisci i mount temporanei e il LUKS (ORA NECESSARIO E POSSIBILE)
echo "EGGS: Inizio pulizia mount temporanei..."
umount /mnt/ext4 || echo "EGGS: ATTENZIONE: umount /mnt/ext4 fallito (codice $?)"
cryptsetup close live-root || echo "EGGS: ATTENZIONE: cryptsetup close live-root fallito (codice $?)"
umount /mnt/live-media || echo "EGGS: ATTENZIONE: umount /mnt/live-media fallito (codice $?)"
echo "EGGS: Pulizia completata."

# 6. Lascia che live-boot trovi lo squashfs in RAM
echo "EGGS: Fatto. filesystem.squashfs copiato in RAM (${SQUASHFS_DEST})."
echo "EGGS: Lascio che live-boot continui..."
echo "EGGS: Log completo salvato in $LOGFILE (in initramfs)."

# NON esportare ROOT_MOUNTED=true, live-boot farà il mount da RAM
exit 0
