#!/bin/sh
# /scripts/live-premount/boot-encrypted-root.sh
# v3.0 - Copia SquashFS in RAM, pulisce i dischi, poi fa overlay e switch_root manuale.

set -e

# --- Logging Setup ---
LOGFILE="/tmp/eggs-premount-boot.log"; FIFO="/tmp/eggs-boot.fifo"; rm -f "$LOGFILE" "$FIFO"; mkfifo "$FIFO" || exit 1; tee -a "$LOGFILE" < "$FIFO" & TEE_PID=$!; exec > "$FIFO" 2>&1; trap 'echo "EGGS-BOOT: Cleanup trap"; rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null || true; exit' EXIT INT TERM
# --- Logging End ---

echo "EGGS-BOOT: =========================================="
echo "EGGS-BOOT: Script Avvio Root Criptato v3.0 (RAM Copy + Manual Switch)"
echo "EGGS-BOOT: =========================================="

# Moduli necessari
echo "EGGS-BOOT: Caricamento moduli..."
modprobe loop 2>/dev/null || true
modprobe dm_mod 2>/dev/null || true
modprobe dm_crypt 2>/dev/null || true
modprobe overlay 2>/dev/null || echo "EGGS-BOOT: WARN: modprobe overlay failed?"
modprobe ext4 2>/dev/null || true
modprobe squashfs 2>/dev/null || true
sleep 2

# 1. Trova live media originale
# ... [Codice ricerca live media come prima, monta su /mnt/live-media] ...
echo "EGGS-BOOT: Ricerca live media originale..."
mkdir -p /mnt/live-media /mnt/ext4
ORIG_MEDIA_MNT="/mnt/live-media"
LIVE_DEV=""
MAX_WAIT_DEV=20; COUNT_DEV=0
while [ -z "$LIVE_DEV" ] && [ $COUNT_DEV -lt $MAX_WAIT_DEV ]; do ls /dev > /dev/null; for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do if [ ! -b "$dev" ]; then continue; fi; if mount -o ro "$dev" "$ORIG_MEDIA_MNT" 2>/dev/null; then if [ -f "${ORIG_MEDIA_MNT}/live/root.img" ]; then echo "EGGS-BOOT: Found Original Live media on $dev"; LIVE_DEV=$dev; break 2; else umount "$ORIG_MEDIA_MNT" 2>/dev/null || true; fi; fi; done; sleep 1; COUNT_DEV=$((COUNT_DEV+1)); done
if [ -z "$LIVE_DEV" ]; then echo "EGGS-BOOT: ERRORE: Live media originale non trovato!"; ls /dev; exit 1; fi

ROOT_IMG_RO="${ORIG_MEDIA_MNT}/live/root.img"

# 2. Sblocca LUKS ed Estrai
echo "EGGS-BOOT: Associazione loop device per $ROOT_IMG_RO..."
LOOP_DEV_OUTPUT=$(/sbin/losetup -f --show "$ROOT_IMG_RO" 2>/dev/null); LOSETUP_EXIT_STATUS=$?
if [ $LOSETUP_EXIT_STATUS -ne 0 ] || [ -z "$LOOP_DEV_OUTPUT" ] || ! [ -b "$LOOP_DEV_OUTPUT" ]; then echo "EGGS-BOOT: ERRORE: Associazione loop fallita!"; exit 1; fi
LOOP_DEV="$LOOP_DEV_OUTPUT"
echo "EGGS-BOOT: Loop device associato: $LOOP_DEV"

echo "EGGS-BOOT: Sblocco LUKS $LOOP_DEV (readonly)..."
if ! cryptsetup open --readonly "$LOOP_DEV" live-root; then echo "EGGS-BOOT: ERRORE: Sblocco LUKS fallito."; /sbin/losetup -d "$LOOP_DEV" || true; exit 1; fi
echo "EGGS-BOOT: Attesa mapper /dev/mapper/live-root..."
MAX_WAIT_MAP=10; COUNT_MAP=0; while [ ! -b /dev/mapper/live-root ] && [ $COUNT_MAP -lt $MAX_WAIT_MAP ]; do sleep 1; COUNT_MAP=$((COUNT_MAP+1)); done
if [ ! -b /dev/mapper/live-root ]; then echo "EGGS-BOOT: ERRORE: Mapper non apparso."; cryptsetup close live-root || true; /sbin/losetup -d "$LOOP_DEV" || true; exit 1; fi

echo "EGGS-BOOT: Montaggio ext4..."
mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4

SQFS_SRC="/mnt/ext4/filesystem.squashfs"
if [ ! -f "$SQFS_SRC" ]; then echo "EGGS-BOOT: ERRORE: $SQFS_SRC non trovato!"; exit 1; fi

# 3. Prepara Destinazione RAM e COPIA
SQUASHFS_RAM_DIR="/run/squashfs_tmp"
SQUASHFS_RAM_PATH="${SQUASHFS_RAM_DIR}/filesystem.squashfs"
mkdir -p "$SQUASHFS_RAM_DIR"

# Calcola dimensione necessaria (solo SquashFS + buffer)
SQFS_SIZE_BYTES=$(stat -c%s "$SQFS_SRC" 2>/dev/null || echo 3500000000) # Fallback 3.5GB
NEEDED_SIZE_MB=$(( $SQFS_SIZE_BYTES / 1024 / 1024 + 500 )) # Aggiunge 500MB buffer
echo "EGGS-BOOT: Spazio stimato per SquashFS in RAM: ${NEEDED_SIZE_MB} MB"
echo "EGGS-BOOT: Aumento dimensione /run (tmpfs)..."
mount -o remount,size=${NEEDED_SIZE_MB}M /run || echo "EGGS-BOOT: WARN: Remount /run fallito, spazio potrebbe essere insufficiente."
df -h /run

echo "EGGS-BOOT: Copia $SQFS_SRC -> $SQUASHFS_RAM_PATH..."
if ! cp "$SQFS_SRC" "$SQUASHFS_RAM_PATH"; then
    echo "EGGS-BOOT: ERRORE: Copia squashfs in RAM fallita! (Spazio insuff?)"
    df -h /run
    exit 1
fi
SQFS_SIZE=$(du -h "$SQUASHFS_RAM_PATH" | cut -f1)
echo "EGGS-BOOT: filesystem.squashfs ($SQFS_SIZE) copiato in RAM."

# 4. PULIZIA COMPLETA (Ora è sicuro!)
echo "EGGS-BOOT: Pulizia COMPLETA mount/device intermedi..."
umount /mnt/ext4 || echo "EGGS-BOOT: WARN: umount /mnt/ext4 failed ($?)"
cryptsetup close live-root || echo "EGGS-BOOT: WARN: cryptsetup close live-root failed ($?)"
/sbin/losetup -d "$LOOP_DEV" || echo "EGGS-BOOT: WARN: losetup -d $LOOP_DEV failed ($?)"
umount "$ORIG_MEDIA_MNT" || echo "EGGS-BOOT: WARN: umount ${ORIG_MEDIA_MNT} failed ($?)"
echo "EGGS-BOOT: Pulizia dischi completata."

# 5. Monta lo squashfs (dalla RAM) su mountpoint temporaneo
SQFS_MNT="/rootfs"
mkdir -p "$SQFS_MNT"
echo "EGGS-BOOT: Montaggio $SQUASHFS_RAM_PATH su ${SQFS_MNT} (ro)..."
if ! mount -t squashfs -o ro,loop "$SQUASHFS_RAM_PATH" "$SQFS_MNT"; then
    echo "EGGS-BOOT: ERRORE: mount squashfs da RAM FALLITO!"; exit 1
fi
echo "EGGS-BOOT: SquashFS da RAM montato con successo su ${SQFS_MNT}."

# 6. Prepara e monta l'Overlay
echo "EGGS-BOOT: Preparazione Overlay..."
OVL_UPPER="/run/overlay_upper"
OVL_WORK="/run/overlay_work"
FINAL_ROOT="/root"
mkdir -p "$OVL_UPPER" "$OVL_WORK" "$FINAL_ROOT"
echo "EGGS-BOOT: Montaggio Overlay su ${FINAL_ROOT}..."
if ! mount -t overlay overlay -o lowerdir=${SQFS_MNT},upperdir=${OVL_UPPER},workdir=${OVL_WORK} ${FINAL_ROOT}; then
    echo "EGGS-BOOT: ERRORE: Mount overlay fallito! (Exit Status: $?)."
    dmesg | tail -n 10
    exit 1
fi
echo "EGGS-BOOT: Overlay montato con successo su ${FINAL_ROOT}."

# 7. Esegui switch_root
echo "EGGS-BOOT: Preparazione per switch_root..."
INIT_PATH="/sbin/init"
if [ ! -x "${FINAL_ROOT}${INIT_PATH}" ]; then INIT_PATH="/usr/lib/systemd/systemd"; fi
if [ ! -x "${FINAL_ROOT}${INIT_PATH}" ]; then echo "EGGS-BOOT: ERRORE: Init non trovato in ${FINAL_ROOT}!"; exit 1; fi
echo "EGGS-BOOT: Trovato init: ${INIT_PATH}"

echo "EGGS-BOOT: Esecuzione: exec switch_root ${FINAL_ROOT} ${INIT_PATH}"
exec 1>&- 2>&-
exec switch_root "${FINAL_ROOT}" "${INIT_PATH}"

echo "EGGS-BOOT: ERRORE CRITICO: switch_root fallito!" > /dev/console
exit 1
