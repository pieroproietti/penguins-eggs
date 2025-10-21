#!/bin/sh
# EGGS LUKS Unlock - Copy to RAM with fake medium
# v25 - Ordine operazioni corretto
set -e

LOGFILE="/tmp/eggs-premount.log"
FIFO="/tmp/eggs-log.fifo"
rm -f "$LOGFILE" "$FIFO"
mkfifo "$FIFO" || exit 1
tee -a "$LOGFILE" < "$FIFO" &
TEE_PID=$!
exec > "$FIFO" 2>&1
trap 'rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null || true' EXIT INT TERM

echo "EGGS: =========================================="
echo "EGGS: LUKS Unlock v25 (Copy to RAM + Fake Medium)"
echo "EGGS: =========================================="

# 1-6. [Tutto uguale fino al mount di ext4]
modprobe dm_mod 2>/dev/null || true
modprobe dm_crypt 2>/dev/null || true

mkdir -p /mnt/live-media
LIVE_DEV=""
MAX_WAIT=20; COUNT=0

while [ -z "$LIVE_DEV" ] && [ $COUNT -lt $MAX_WAIT ]; do
    for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do
        [ -b "$dev" ] || continue
        if mount -o ro "$dev" /mnt/live-media 2>/dev/null; then
            if [ -f /mnt/live-media/live/root.img ]; then
                echo "EGGS: ✓ Live media: $dev"
                LIVE_DEV="$dev"; break 2
            fi
            umount /mnt/live-media 2>/dev/null || true
        fi
    done
    COUNT=$((COUNT + 1)); sleep 1
done

[ -z "$LIVE_DEV" ] && exit 1

ROOT_IMG="/mnt/live-media/live/root.img"
cryptsetup isLuks "$ROOT_IMG" || exit 1

echo "EGGS: Sblocco LUKS..."
cryptsetup open --readonly "$ROOT_IMG" live-root || exit 1

COUNT=0
while [ ! -b /dev/mapper/live-root ] && [ $COUNT -lt 10 ]; do
    sleep 1; COUNT=$((COUNT + 1))
done
[ ! -b /dev/mapper/live-root ] && exit 1

mkdir -p /mnt/ext4
mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4 || exit 1

SQUASHFS_SRC="/mnt/ext4/filesystem.squashfs"
[ ! -f "$SQUASHFS_SRC" ] && exit 1

echo "EGGS: ✓ filesystem.squashfs: $(du -h "$SQUASHFS_SRC" | cut -f1)"

# 7. Rimonta /run con spazio
mount -o remount,size=4G /run 2>/dev/null || true
echo "EGGS: Spazio /run: $(df -h /run | tail -1 | awk '{print $4}')"

# 8. Copia in directory SEPARATA (non /run/live/medium ancora!)
echo "EGGS: Copia in RAM..."
mkdir -p /run/eggs-ram/live
SQUASHFS_DEST="/run/eggs-ram/live/filesystem.squashfs"

if ! cp "$SQUASHFS_SRC" "$SQUASHFS_DEST"; then
    echo "EGGS: ✗ Copia fallita"
    exit 1
fi

echo "EGGS: ✓ Copia OK: $(du -h "$SQUASHFS_DEST" | cut -f1)"

# ... [tutto il resto uguale fino a qui] ...

# 9. Pulizia
umount /mnt/ext4 2>/dev/null || true
cryptsetup close live-root 2>/dev/null || true

# 10. Crea "medium finto"
echo "EGGS: Creazione medium finto..."

mkdir -p /run/live/medium-ovl-upper /run/live/medium-ovl-work /run/live/medium

# Overlay del CD originale
mount -t overlay overlay \
    -o lowerdir=/mnt/live-media,upperdir=/run/live/medium-ovl-upper,workdir=/run/live/medium-ovl-work \
    /run/live/medium

echo "EGGS: ✓ Overlay medium creato"

# 11. Sostituisci root.img con filesystem.squashfs
echo "EGGS: Preparazione filesystem.squashfs..."

# Rimuovi root.img
rm -f /run/live/medium/live/root.img

# IMPORTANTE: Crea un file placeholder (vuoto va bene)
touch /run/live/medium/live/filesystem.squashfs

# Bind mount del file vero dalla RAM
if ! mount --bind "$SQUASHFS_DEST" /run/live/medium/live/filesystem.squashfs; then
    echo "EGGS: ✗ ERRORE: Bind mount fallito"
    ls -lh "$SQUASHFS_DEST"
    exit 1
fi

echo "EGGS: ✓ filesystem.squashfs montato con bind"

# 12. Verifica
echo "EGGS: Verifica finale:"
ls -lh /run/live/medium/live/filesystem.squashfs
file /run/live/medium/live/filesystem.squashfs

# 13. Esporta
export LIVE_MEDIA="/run/live/medium"
export EGGS_TORAM="true"

echo ""
echo "EGGS: =========================================="
echo "EGGS: Setup completato"
echo "EGGS: =========================================="
echo ""

exit 0