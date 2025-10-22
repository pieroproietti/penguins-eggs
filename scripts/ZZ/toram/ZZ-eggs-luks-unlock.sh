#!/bin/sh
# EGGS LUKS Unlock - Copy to RAM with complete medium structure
# v26 - Copia struttura .disk completa
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
echo "EGGS: LUKS Unlock v26 (Copy to RAM + Complete Structure)"
echo "EGGS: =========================================="

# 1-6. Trova media, sblocca LUKS, monta ext4
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

# 8. Copia filesystem.squashfs in RAM
echo "EGGS: Copia filesystem.squashfs in RAM..."
mkdir -p /run/eggs-ram/live
SQUASHFS_DEST="/run/eggs-ram/live/filesystem.squashfs"

if ! cp "$SQUASHFS_SRC" "$SQUASHFS_DEST"; then
    echo "EGGS: ✗ Copia fallita"
    exit 1
fi

echo "EGGS: ✓ Copia OK: $(du -h "$SQUASHFS_DEST" | cut -f1)"

# 9. Pulizia volume LUKS (non serve più)
umount /mnt/ext4 2>/dev/null || true
cryptsetup close live-root 2>/dev/null || true

# 10. Crea overlay del medium (MA NON smontare ancora /mnt/live-media!)
echo "EGGS: Creazione medium finto..."

mkdir -p /run/live/medium-ovl-upper /run/live/medium-ovl-work /run/live/medium

mount -t overlay overlay \
    -o lowerdir=/mnt/live-media,upperdir=/run/live/medium-ovl-upper,workdir=/run/live/medium-ovl-work \
    /run/live/medium

echo "EGGS: ✓ Overlay creato"

# 11. Rimuovi root.img e prepara filesystem.squashfs
echo "EGGS: Preparazione filesystem.squashfs..."
rm -f /run/live/medium/live/root.img

touch /run/live/medium/live/filesystem.squashfs

if ! mount --bind "$SQUASHFS_DEST" /run/live/medium/live/filesystem.squashfs; then
    echo "EGGS: ✗ Bind mount fallito"
    exit 1
fi

echo "EGGS: ✓ filesystem.squashfs bind-mounted"

# 12. Copia TUTTA la struttura .disk (IMPORTANTE!)
echo "EGGS: Copia struttura .disk completa..."

if [ -d /mnt/live-media/.disk ]; then
    # Copia ricorsiva di tutto .disk
    mkdir -p /run/live/medium/.disk
    cp -a /mnt/live-media/.disk/* /run/live/medium/.disk/ 2>/dev/null || true
    echo "EGGS: ✓ Struttura .disk copiata"
else
    echo "EGGS: WARN: .disk non trovato sul medium originale"
    # Crea minimale
    mkdir -p /run/live/medium/.disk
    echo "Debian Live" > /run/live/medium/.disk/info
    touch /run/live/medium/.disk/live
fi

# 13. Copia anche altri file/directory che potrebbero servire
echo "EGGS: Copia struttura aggiuntiva..."

# Copia isolinux, boot, ecc. se esistono
for dir in isolinux boot EFI .disk; do
    if [ -d "/mnt/live-media/$dir" ] && [ "$dir" != ".disk" ]; then
        cp -a "/mnt/live-media/$dir" /run/live/medium/ 2>/dev/null || true
    fi
done

# 14. ORA possiamo smontare il CD originale
echo "EGGS: Smontaggio CD originale..."
umount /mnt/live-media 2>/dev/null || true

# 15. Verifica finale
echo "EGGS: Verifica finale:"
echo "  filesystem.squashfs:"
ls -lh /run/live/medium/live/filesystem.squashfs
echo ""
echo "  Struttura .disk:"
ls -la /run/live/medium/.disk/ 2>/dev/null || echo "  .disk non presente"
echo ""
echo "  Contenuto medium:"
ls -1 /run/live/medium/ | head -10

# 16. Esporta variabili per live-boot
export LIVE_MEDIA="/run/live/medium"
export LIVE_MEDIA_PATH="live"
export live_media="/run/live/medium"
export live_media_path="live"
export EGGS_TORAM="true"

echo ""
echo "EGGS: =========================================="
echo "EGGS: Setup completato"
echo "EGGS: =========================================="
echo "EGGS: Struttura completa pronta per live-boot"
echo "EGGS: filesystem.squashfs: $(du -h "$SQUASHFS_DEST" | cut -f1) in RAM"
echo "EGGS: CD/USB può essere rimosso"
echo ""

exit 0
