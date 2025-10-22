#!/bin/sh
# EGGS LUKS Unlock - Copy to RAM version
# v24 - Fix spazio /run
set -e

# --- Logging Setup ---
LOGFILE="/tmp/eggs-premount.log"
FIFO="/tmp/eggs-log.fifo"
rm -f "$LOGFILE" "$FIFO"
if ! mkfifo "$FIFO"; then 
    echo "EGGS: FATALE: Impossibile creare FIFO"
    exit 1
fi
tee -a "$LOGFILE" < "$FIFO" &
TEE_PID=$!
exec > "$FIFO" 2>&1
trap 'rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null || true' EXIT INT TERM

echo "EGGS: =========================================="
echo "EGGS: LUKS Unlock Script v24 (Copy to RAM)"
echo "EGGS: =========================================="
echo ""

# 1. Carica moduli
echo "EGGS: Caricamento moduli kernel..."
modprobe dm_mod 2>/dev/null || true
modprobe dm_crypt 2>/dev/null || true

# 2. Trova live media
echo "EGGS: Ricerca live media..."
mkdir -p /mnt/live-media

LIVE_DEV=""
MAX_WAIT=20
COUNT=0

while [ -z "$LIVE_DEV" ] && [ $COUNT -lt $MAX_WAIT ]; do
    for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do
        [ -b "$dev" ] || continue
        
        if mount -o ro "$dev" /mnt/live-media 2>/dev/null; then
            if [ -f /mnt/live-media/live/root.img ]; then
                echo "EGGS: ✓ Live media trovato su $dev"
                LIVE_DEV="$dev"
                break 2
            fi
            umount /mnt/live-media 2>/dev/null || true
        fi
    done
    COUNT=$((COUNT + 1))
    sleep 1
done

if [ -z "$LIVE_DEV" ]; then
    echo "EGGS: ✗ ERRORE: Live media non trovato"
    exit 1
fi

ROOT_IMG="/mnt/live-media/live/root.img"

# 3. Verifica LUKS
echo "EGGS: Verifica LUKS..."
if ! cryptsetup isLuks "$ROOT_IMG"; then
    echo "EGGS: ✗ ERRORE: Non è LUKS"
    exit 1
fi

# 4. Sblocca LUKS
echo "EGGS: Sblocco LUKS..."
echo "EGGS: Inserire passphrase:"

if ! cryptsetup open --readonly "$ROOT_IMG" live-root; then
    echo "EGGS: ✗ ERRORE: Sblocco fallito"
    exit 1
fi

echo "EGGS: ✓ LUKS sbloccato"

# 5. Attendi device mapper
MAX_WAIT_MAP=10
COUNT_MAP=0
while [ ! -b /dev/mapper/live-root ] && [ $COUNT_MAP -lt $MAX_WAIT_MAP ]; do
    sleep 1
    COUNT_MAP=$((COUNT_MAP + 1))
done

if [ ! -b /dev/mapper/live-root ]; then
    echo "EGGS: ✗ ERRORE: Device mapper non apparso"
    exit 1
fi

# 6. Monta ext4
echo "EGGS: Montaggio ext4..."
mkdir -p /mnt/ext4

if ! mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4; then
    echo "EGGS: ✗ ERRORE: Mount fallito"
    cryptsetup close live-root || true
    exit 1
fi

# 7. Verifica filesystem.squashfs
SQUASHFS_SRC="/mnt/ext4/filesystem.squashfs"

if [ ! -f "$SQUASHFS_SRC" ]; then
    echo "EGGS: ✗ ERRORE: filesystem.squashfs non trovato"
    ls -la /mnt/ext4/
    umount /mnt/ext4 || true
    cryptsetup close live-root || true
    exit 1
fi

SQUASHFS_SIZE=$(du -h "$SQUASHFS_SRC" | cut -f1)
SQUASHFS_SIZE_KB=$(du -k "$SQUASHFS_SRC" | cut -f1)
echo "EGGS: ✓ Trovato filesystem.squashfs ($SQUASHFS_SIZE)"

# 8. Rimonta /run con più spazio
echo "EGGS: Spazio attuale /run:"
df -h /run | tail -1

echo "EGGS: Rimontaggio /run con più spazio..."
if ! mount -o remount,size=4G /run; then
    echo "EGGS: ✗ ATTENZIONE: Remount fallito, provo comunque..."
fi

echo "EGGS: Nuovo spazio /run:"
df -h /run | tail -1

# 9. Verifica spazio
FREE_SPACE=$(df /run | tail -1 | awk '{print $4}')
NEEDED_SPACE=$((SQUASHFS_SIZE_KB + 102400))  # +100MB sicurezza

echo "EGGS: Verifica spazio:"
echo "  Necessario: $((NEEDED_SPACE / 1024))MB"
echo "  Disponibile: $((FREE_SPACE / 1024))MB"

if [ "$FREE_SPACE" -lt "$NEEDED_SPACE" ]; then
    echo "EGGS: ✗ ERRORE: Spazio insufficiente!"
    echo "EGGS: Provo comunque..."
fi

# 10. Crea struttura
echo "EGGS: Creazione struttura directory..."
mkdir -p /run/live/medium/live

# 11. Copia in RAM
echo "EGGS: Copia filesystem.squashfs in RAM..."
echo "EGGS: Attendi, può richiedere 1-2 minuti..."

SQUASHFS_DEST="/run/live/medium/live/filesystem.squashfs"

if ! cp "$SQUASHFS_SRC" "$SQUASHFS_DEST"; then
    echo "EGGS: ✗ ERRORE: Copia fallita"
    echo "EGGS: Spazio finale /run:"
    df -h /run
    umount /mnt/ext4 || true
    cryptsetup close live-root || true
    exit 1
fi

echo "EGGS: ✓ Copia completata"

# 12. Verifica
if [ ! -f "$SQUASHFS_DEST" ]; then
    echo "EGGS: ✗ ERRORE: File destinazione non esiste"
    exit 1
fi

DEST_SIZE=$(du -h "$SQUASHFS_DEST" | cut -f1)
echo "EGGS: ✓ Verifica: $DEST_SIZE in RAM"

# 13. Pulizia
echo "EGGS: Pulizia..."
umount /mnt/ext4 || true
cryptsetup close live-root || true
umount /mnt/live-media || true
echo "EGGS: ✓ Pulizia completata"

# 14. Verifica finale
echo "EGGS: Struttura finale:"
ls -lh /run/live/medium/live/

# 15. Esporta variabili
export LIVE_MEDIA="/run/live/medium"
export EGGS_TORAM="true"

echo ""
echo "EGGS: =========================================="
echo "EGGS: Setup completato"
echo "EGGS: =========================================="
echo "EGGS: filesystem.squashfs in RAM: $DEST_SIZE"
echo "EGGS: Spazio RAM rimanente:"
df -h /run | tail -1
echo ""
echo "EGGS: Passando controllo a live-boot..."
echo ""

exit 0