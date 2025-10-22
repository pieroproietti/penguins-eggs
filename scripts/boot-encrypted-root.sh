#!/bin/sh
# /scripts/live-premount/boot-encrypted-root.sh
# v2.0 - Ricostruisce il medium live standard in RAM, poi lascia fare a live-boot.

set -e

# --- Logging Setup ---
LOGFILE="/tmp/eggs-premount-boot.log"; FIFO="/tmp/eggs-boot.fifo"; rm -f "$LOGFILE" "$FIFO"; mkfifo "$FIFO" || exit 1; tee -a "$LOGFILE" < "$FIFO" & TEE_PID=$!; exec > "$FIFO" 2>&1; trap 'echo "EGGS-BOOT: Cleanup trap"; rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null || true; exit' EXIT INT TERM
# --- Logging End ---

echo "EGGS-BOOT: =========================================="
echo "EGGS-BOOT: Script Avvio Root Criptato v2.0 (Rebuild Medium in RAM)"
echo "EGGS-BOOT: =========================================="

# Moduli necessari
echo "EGGS-BOOT: Caricamento moduli..."
modprobe loop 2>/dev/null || true
modprobe dm_mod 2>/dev/null || true
modprobe dm_crypt 2>/dev/null || true
modprobe overlay 2>/dev/null || true # Potrebbe servire a live-boot dopo
modprobe ext4 2>/dev/null || true
modprobe squashfs 2>/dev/null || true
sleep 2

# 1. Trova live media originale
echo "EGGS-BOOT: Ricerca live media originale..."
mkdir -p /mnt/live-media /mnt/ext4
ORIG_MEDIA_MNT="/mnt/live-media"
LIVE_DEV=""
# ... [Codice ricerca live media come prima, monta su ORIG_MEDIA_MNT] ...
MAX_WAIT_DEV=20; COUNT_DEV=0
while [ -z "$LIVE_DEV" ] && [ $COUNT_DEV -lt $MAX_WAIT_DEV ]; do ls /dev > /dev/null; for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do if [ ! -b "$dev" ]; then continue; fi; if mount -o ro "$dev" "$ORIG_MEDIA_MNT" 2>/dev/null; then if [ -f "${ORIG_MEDIA_MNT}/live/root.img" ]; then echo "EGGS-BOOT: Found Original Live media on $dev"; LIVE_DEV=$dev; break 2; else umount "$ORIG_MEDIA_MNT" 2>/dev/null || true; fi; fi; done; sleep 1; COUNT_DEV=$((COUNT_DEV+1)); done
if [ -z "$LIVE_DEV" ]; then echo "EGGS-BOOT: ERRORE: Live media originale non trovato!"; ls /dev; exit 1; fi

ROOT_IMG_RO="${ORIG_MEDIA_MNT}/live/root.img"
RAM_MEDIA_MNT="/run/live/medium" # Destinazione finale in RAM

# 2. Prepara Destinazione RAM (Aumenta dimensione se necessario)
echo "EGGS-BOOT: Preparazione RAM disk ${RAM_MEDIA_MNT}..."
# Calcola dimensione necessaria approssimativa (dimensione ISO + dimensione squashfs)
# Potrebbe essere necessario un calcolo più preciso o un valore fisso generoso
NEEDED_SIZE_MB=$(( $(du -sm "$ORIG_MEDIA_MNT" | cut -f1) + $(stat -c%s "$ROOT_IMG_RO" 2>/dev/null || echo 1500000000) / 1024 / 1024 + 500 )) # Aggiunge 500MB buffer
echo "EGGS-BOOT: Spazio stimato necessario in /run: ${NEEDED_SIZE_MB} MB"
echo "EGGS-BOOT: Aumento dimensione /run (tmpfs)..."
if ! mount -o remount,size=${NEEDED_SIZE_MB}M /run; then
    echo "EGGS-BOOT: WARN: Remount /run fallito, spazio potrebbe essere insufficiente."
    df -h /run
fi
mkdir -p "$RAM_MEDIA_MNT"

# 3. Copia Struttura ISO in RAM (escludendo root.img)
echo "EGGS-BOOT: Copia struttura ISO da ${ORIG_MEDIA_MNT} a ${RAM_MEDIA_MNT} (escludendo root.img)..."
# Usare rsync se disponibile è più facile per escludere
if command -v rsync >/dev/null; then
    if ! rsync -a --exclude='/live/root.img' "${ORIG_MEDIA_MNT}/" "$RAM_MEDIA_MNT/"; then
        echo "EGGS-BOOT: ERRORE: rsync fallito!"; exit 1
    fi
else
    # Alternativa con cp e rm
    echo "EGGS-BOOT: rsync non trovato, uso cp -a e rm..."
    if ! cp -a "${ORIG_MEDIA_MNT}/." "$RAM_MEDIA_MNT/"; then
         echo "EGGS-BOOT: ERRORE: cp -a fallito!"; exit 1
    fi
    rm -f "${RAM_MEDIA_MNT}/live/root.img" || echo "EGGS-BOOT: WARN: Impossibile rimuovere root.img da RAM disk (forse non esisteva)."
fi
# Assicurati che la directory live esista nella destinazione
mkdir -p "${RAM_MEDIA_MNT}/live"
echo "EGGS-BOOT: Struttura ISO copiata in RAM."

# 4. Sblocca LUKS ed Estrai filesystem.squashfs
echo "EGGS-BOOT: Associazione loop device per $ROOT_IMG_RO..."
LOOP_DEV_OUTPUT=$(/sbin/losetup -f --show "$ROOT_IMG_RO" 2>/dev/null); LOSETUP_EXIT_STATUS=$?
if [ $LOSETUP_EXIT_STATUS -ne 0 ] || [ -z "$LOOP_DEV_OUTPUT" ] || ! [ -b "$LOOP_DEV_OUTPUT" ]; then echo "EGGS-BOOT: ERRORE: Associazione loop fallita!"; exit 1; fi
LOOP_DEV="$LOOP_DEV_OUTPUT"
echo "EGGS-BOOT: Loop device associato: $LOOP_DEV"

echo "EGGS-BOOT: Sblocco LUKS $LOOP_DEV..."
if ! cryptsetup open "$LOOP_DEV" live-root; then echo "EGGS-BOOT: ERRORE: Sblocco LUKS fallito."; /sbin/losetup -d "$LOOP_DEV" || true; exit 1; fi
echo "EGGS-BOOT: Attesa mapper /dev/mapper/live-root..."
MAX_WAIT_MAP=10; COUNT_MAP=0; while [ ! -b /dev/mapper/live-root ] && [ $COUNT_MAP -lt $MAX_WAIT_MAP ]; do sleep 1; COUNT_MAP=$((COUNT_MAP+1)); done
if [ ! -b /dev/mapper/live-root ]; then echo "EGGS-BOOT: ERRORE: Mapper non apparso."; cryptsetup close live-root || true; /sbin/losetup -d "$LOOP_DEV" || true; exit 1; fi

echo "EGGS-BOOT: Montaggio ext4..."
mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4

SQFS_SRC="/mnt/ext4/filesystem.squashfs"
SQFS_DEST="${RAM_MEDIA_MNT}/live/filesystem.squashfs" # Destinazione finale in RAM
echo "EGGS-BOOT: Copia $SQFS_SRC -> $SQFS_DEST..."
if [ ! -f "$SQFS_SRC" ]; then echo "EGGS-BOOT: ERRORE: $SQFS_SRC non trovato!"; exit 1; fi
if ! cp "$SQFS_SRC" "$SQFS_DEST"; then
    echo "EGGS-BOOT: ERRORE: Copia squashfs in RAM fallita!"
    df -h /run
    exit 1
fi
SQFS_SIZE=$(du -h "$SQFS_DEST" | cut -f1)
echo "EGGS-BOOT: filesystem.squashfs ($SQFS_SIZE) copiato in RAM."

# 5. Pulizia Mount/Device Intermedi
echo "EGGS-BOOT: Pulizia mount/device intermedi..."
umount /mnt/ext4 || echo "EGGS-BOOT: WARN: umount /mnt/ext4 failed ($?)"
cryptsetup close live-root || echo "EGGS-BOOT: WARN: cryptsetup close live-root failed ($?)"
/sbin/losetup -d "$LOOP_DEV" || echo "EGGS-BOOT: WARN: losetup -d $LOOP_DEV failed ($?)"
umount "$ORIG_MEDIA_MNT" || echo "EGGS-BOOT: WARN: umount ${ORIG_MEDIA_MNT} failed ($?)"
echo "EGGS-BOOT: Pulizia completata."

# 6. Passa il Testimone a live-boot
echo "EGGS-BOOT: =========================================="
echo "EGGS-BOOT: Medium live ricostruito in RAM su ${RAM_MEDIA_MNT}"
ls -lR "$RAM_MEDIA_MNT" | head -n 20 # Mostra parte della struttura creata
echo "EGGS-BOOT: Lascio che live-boot continui (potrebbe servire 'live-media=/run/live/medium')..."
echo "EGGS-BOOT: =========================================="
# NON esportiamo ROOT_MOUNTED, lasciamo che live-boot trovi il medium in RAM
exit 0
