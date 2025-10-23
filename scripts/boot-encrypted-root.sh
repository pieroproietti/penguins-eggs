#!/bin/sh
# /scripts/live-premount/boot-encrypted-root.sh
# v2.2 - Minimal RAM Copy + Supporto Plymouth

set -e

# --- Logging Setup ---
LOGFILE="/tmp/eggs-premount-boot.log"; FIFO="/tmp/eggs-boot.fifo"; rm -f "$LOGFILE" "$FIFO"; mkfifo "$FIFO" || exit 1; tee -a "$LOGFILE" < "$FIFO" & TEE_PID=$!; exec > "$FIFO" 2>&1; trap 'echo "EGGS-BOOT: Cleanup trap"; rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null || true; exit' EXIT INT TERM
# --- Logging End ---

echo "EGGS-BOOT: =========================================="
echo "EGGS-BOOT: boot from ISO fullcryt  v2.2 (Minimal RAM + Plymouth)"
echo "EGGS-BOOT: =========================================="

# Moduli necessari
echo "EGGS-BOOT: Loading modules..."
modprobe loop 2>/dev/null || true
modprobe dm_mod 2>/dev/null || true
modprobe dm_crypt 2>/dev/null || true
modprobe overlay 2>/dev/null || true
modprobe ext4 2>/dev/null || true
modprobe squashfs 2>/dev/null || true
sleep 2

echo "EGGS-BOOT: Live search for boot media..."
# 1. Create mountpoint /mnt/live-media
mkdir -p /mnt/live-media /mnt/ext4
ORIG_MEDIA_MNT="/mnt/live-media"
LIVE_DEV=""
# ... [Live search for boot media] ...
MAX_WAIT_DEV=20; COUNT_DEV=0
while [ -z "$LIVE_DEV" ] && [ $COUNT_DEV -lt $MAX_WAIT_DEV ]; do ls /dev > /dev/null; for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do if [ ! -b "$dev" ]; then continue; fi; if mount -o ro "$dev" "$ORIG_MEDIA_MNT" 2>/dev/null; then if [ -f "${ORIG_MEDIA_MNT}/live/root.img" ]; then echo "EGGS-BOOT: Found Original Live media on $dev"; LIVE_DEV=$dev; break 2; else umount "$ORIG_MEDIA_MNT" 2>/dev/null || true; fi; fi; done; sleep 1; COUNT_DEV=$((COUNT_DEV+1)); done
if [ -z "$LIVE_DEV" ]; then echo "EGGS-BOOT: ERRORE: Live media originale non trovato!"; ls /dev; exit 1; fi

ROOT_IMG_RO="${ORIG_MEDIA_MNT}/live/root.img"
RAM_MEDIA_MNT="/run/live/medium" # Destinazione finale in RAM

# 2. Associa loop device (per definire $LOOP_DEV)
echo "EGGS-BOOT: Associazione loop device per $ROOT_IMG_RO..."
LOOP_DEV_OUTPUT=$(/sbin/losetup -f --show "$ROOT_IMG_RO" 2>/dev/null); LOSETUP_EXIT_STATUS=$?
if [ $LOSETUP_EXIT_STATUS -ne 0 ] || [ -z "$LOOP_DEV_OUTPUT" ] || ! [ -b "$LOOP_DEV_OUTPUT" ]; then echo "EGGS-BOOT: ERRORE: Associazione loop fallita!"; exit 1; fi
LOOP_DEV="$LOOP_DEV_OUTPUT"
echo "EGGS-BOOT: Loop device associato: $LOOP_DEV"

# 2b. Sblocca LUKS (con supporto Plymouth)
echo "EGGS-BOOT: Sblocco LUKS $LOOP_DEV (readonly)..."

# Controlla se Plymouth è attivo
if plymouth --ping 2>/dev/null; then
    echo "EGGS-BOOT: Plymouth attivo. Chiedo password via Plymouth..."
    
    # Chiedi la password a Plymouth e passala a cryptsetup via stdin (--key-file -)
    if ! plymouth ask-for-password --prompt="Enter passphrase for encrypted root" | cryptsetup open --readonly --key-file - "$LOOP_DEV" live-root; then
        echo "EGGS-BOOT: ERRORE: Sblocco LUKS via Plymouth fallito."
        plymouth display-message --text="LUKS Unlock Failed"
        sleep 5
        /sbin/losetup -d "$LOOP_DEV" || true
        exit 1
    fi
else
    # Fallback: Plymouth non attivo (es. boot senza 'quiet splash')
    echo "EGGS-BOOT: Plymouth non attivo. Chiedo password via console..."
    if ! cryptsetup open --readonly "$LOOP_DEV" live-root; then
        echo "EGGS-BOOT: ERRORE: Sblocco LUKS (console) fallito su $LOOP_DEV."
        /sbin/losetup -d "$LOOP_DEV" || true
        exit 1
    fi
fi

echo "EGGS-BOOT: LUKS sbloccato ($LOOP_DEV -> live-root) [readonly]. Attesa mapper..."

# 2c. Attesa mapper
MAX_WAIT_MAP=10; COUNT_MAP=0; while [ ! -b /dev/mapper/live-root ] && [ $COUNT_MAP -lt $MAX_WAIT_MAP ]; do sleep 1; COUNT_MAP=$((COUNT_MAP+1)); done
if [ ! -b /dev/mapper/live-root ]; then echo "EGGS-BOOT: ERRORE: Mapper non apparso."; cryptsetup close live-root || true; /sbin/losetup -d "$LOOP_DEV" || true; exit 1; fi

# 2d. Montaggio ext4
echo "EGGS-BOOT: Montaggio ext4..."
mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4

SQFS_SRC="/mnt/ext4/filesystem.squashfs"
if [ ! -f "$SQFS_SRC" ]; then echo "EGGS-BOOT: ERRORE: $SQFS_SRC non trovato!"; exit 1; fi

# 3. Prepara Destinazione RAM (ORA calcoliamo la dimensione GIUSTA)
echo "EGGS-BOOT: Preparazione RAM disk ${RAM_MEDIA_MNT}..."
SQFS_SIZE_BYTES=$(stat -c%s "$SQFS_SRC")
NEEDED_SIZE_MB=$(( $SQFS_SIZE_BYTES / 1024 / 1024 + 500 )) # Aggiunge 500MB buffer
echo "EGGS-BOOT: Spazio stimato necessario in /run: ${NEEDED_SIZE_MB} MB"
echo "EGGS-BOOT: Aumento dimensione /run (tmpfs)..."
if ! mount -o remount,size=${NEEDED_SIZE_MB}M /run; then
    echo "EGGS-BOOT: WARN: Remount /run fallito, spazio potrebbe essere insufficiente."
    df -h /run
fi
mkdir -p "${RAM_MEDIA_MNT}/live"

# 4. Copia SOLO filesystem.squashfs in RAM
SQFS_DEST="${RAM_MEDIA_MNT}/live/filesystem.squashfs"
echo "EGGS-BOOT: Copia $SQFS_SRC -> $SQFS_DEST..."
if command -v rsync >/dev/null; then
    rsync -a --info=progress2 "$SQFS_SRC" "$SQFS_DEST"
else
    cp "$SQFS_SRC" "$SQFS_DEST"
fi
SQFS_SIZE=$(du -h "$SQFS_DEST" | cut -f1)
echo "EGGS-BOOT: filesystem.squashfs ($SQFS_SIZE) copiato in RAM."

# 5. Copia SOLO i marker .disk
echo "EGGS-BOOT: Copia marker .disk da ${ORIG_MEDIA_MNT}..."
if [ -d "${ORIG_MEDIA_MNT}/.disk" ]; then
    cp -a "${ORIG_MEDIA_MNT}/.disk" "${RAM_MEDIA_MNT}/"
    echo "EGGS-BOOT: .disk copiato."
else
    echo "EGGS-BOOT: WARN: Directory .disk non trovata sul media originale."
fi

# 5.1 Copy vmlinuz and initrafs (usefull for installation)
echo "EGGS-BOOT: Copia marker .disk da ${ORIG_MEDIA_MNT}..."
if [ -d "${ORIG_MEDIA_MNT}/.disk" ]; then
    cp -a "${ORIG_MEDIA_MNT}/.disk" "${RAM_MEDIA_MNT}/"
    cp -a "${ORIG_MEDIA_MNT}/live/vmlinuz*" "${RAM_MEDIA_MNT}/live/"
    cp -a "${ORIG_MEDIA_MNT}/live/initrd*" "${RAM_MEDIA_MNT}/live/"
    echo "EGGS-BOOT: .disk copiato."
else
    echo "EGGS-BOOT: WARN: Directory .disk non trovata sul media originale."
fi



# 6. Pulizia Mount/Device Intermedi
echo "EGGS-BOOT: Pulizia mount/device intermedi..."
umount /mnt/ext4 || echo "EGGS-BOOT: WARN: umount /mnt/ext4 failed ($?)"
cryptsetup close live-root || echo "EGGS-BOOT: WARN: cryptsetup close live-root failed ($?)"
/sbin/losetup -d "$LOOP_DEV" || echo "EGGS-BOOT: WARN: losetup -d $LOOP_DEV failed ($?)"
umount "$ORIG_MEDIA_MNT" || echo "EGGS-BOOT: WARN: umount ${ORIG_MEDIA_MNT} failed ($?)"
echo "EGGS-BOOT: Pulizia completata."



# 7. Passa il Testimone a live-boot
echo "EGGS-BOOT: =========================================="
echo "EGGS-BOOT: Medium live MINIMALE ricostruito in RAM su ${RAM_MEDIA_MNT}"
ls -l "$RAM_MEDIA_MNT"
ls -l "${RAM_MEDIA_MNT}/live"
echo "EGGS-BOOT: Lascio che live-boot continui (con 'live-media=/run/live/medium')..."
echo "EGGS-BOOT: =========================================="
exit 0