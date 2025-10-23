#!/bin/sh
# /scripts/live-premount/boot-encrypted-root.sh
# v3.1 - Verifica SquashFS PRIMA di copiare in RAM

set -e

# --- Logging Setup ---
LOGFILE="/tmp/eggs-premount-boot.log"; FIFO="/tmp/eggs-boot.fifo"; rm -f "$LOGFILE" "$FIFO"; mkfifo "$FIFO" || exit 1; tee -a "$LOGFILE" < "$FIFO" & TEE_PID=$!; exec > "$FIFO" 2>&1; trap 'echo "EGGS-BOOT: Cleanup trap"; rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null || true; exit' EXIT INT TERM
# --- Logging End ---

echo "EGGS-BOOT: =========================================="
echo "EGGS-BOOT: Script Avvio Root Criptato v3.1 (Verify Source SquashFS)"
echo "EGGS-BOOT: =========================================="

echo "EGGS-BOOT: Caricamento moduli..."
modprobe loop 2>/dev/null || true
modprobe dm_mod 2>/dev/null || true
modprobe dm_crypt 2>/dev/null || true
modprobe overlay 2>/dev/null || echo "EGGS-BOOT: WARN: modprobe overlay failed?"
modprobe ext4 2>/dev/null || true
modprobe squashfs 2>/dev/null || true
sleep 2

echo "EGGS-BOOT: Device mapper pronto."

echo "EGGS-BOOT: --- Inizio Log Kernel (dmesg) post-cryptsetup ---"
dmesg | tail -n 20
echo "EGGS-BOOT: --- Fine Log Kernel ---"

echo "EGGS-BOOT: Attesa udev (trigger + settle + probe + sleep)..."
# Forza udev a processare il nuovo device mapper
udevadm trigger --subsystem-match=block --action=add
# Aspetta che udev finisca
udevadm settle
# Legge il device con blkid per forzare il kernel a riconoscerlo
echo "EGGS-BOOT: Probing /dev/mapper/live-root with /sbin/blkid..."
if ! /sbin/blkid /dev/mapper/live-root; then
    echo "EGGS-BOOT: WARN: /sbin/blkid fallito (Errore $?). Continuo comunque..."
    # Se blkid fallisce, tentiamo almeno uno sleep più lungo
    sleep 5
else
    echo "EGGS-BOOT: blkid probe OK."
    sleep 2 # Pausa più breve se blkid ha funzionato
fi
echo "EGGS-BOOT: udev/probe/sleep completato."

# 3. Monta l'ext4 (ro)
echo "EGGS-BOOT: Tentativo di risolvere il link per /dev/mapper/live-root..."
# readlink -f risolve il link simbolico (es. in /dev/dm-0)
DM_DEV=$(readlink -f /dev/mapper/live-root)

if [ -z "$DM_DEV" ] || ! [ -b "$DM_DEV" ]; then
    echo "EGGS-BOOT: WARN: Impossibile trovare il device dm-X reale. Tentativo con /dev/dm-0..."
    DM_DEV="/dev/dm-0" # Fallback, spesso è dm-0
fi

echo "EGGS-BOOT: Device reale identificato: ${DM_DEV}. Tento il mount."

# Tenta di montare il device reale
if ! mount -t ext4 -o ro "$DM_DEV" /mnt/ext4; then
    echo "EGGS-BOOT: ERRORE: Mount di ${DM_DEV} fallito. (Errore $?)"
    echo "EGGS-BOOT: Tentativo fallback con /dev/mapper/live-root..."
    
    # Ritenta il metodo originale come ultima spiaggia
    if ! mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4; then
        echo "EGGS-BOOT: ERRORE: Mount fallito anche con /dev/mapper/live-root."
        dmesg | tail -n 5
        exit 1
    fi
fi
echo "EGGS-BOOT: Device ${DM_DEV} (o fallback) montato su /mnt/ext4 (ro)."


SQFS_SRC="/mnt/ext4/filesystem.squashfs"
if [ ! -f "$SQFS_SRC" ]; then echo "EGGS-BOOT: ERRORE: $SQFS_SRC non trovato!"; exit 1; fi

# --- NUOVO BLOCCO DI VERIFICA ---
echo "EGGS-BOOT: Verifica integrità $SQFS_SRC (tentativo mount)..."
SQFS_TEST_MNT="/mnt/sqfs_test"
mkdir -p "$SQFS_TEST_MNT"
if ! mount -t squashfs -o ro,loop "$SQFS_SRC" "$SQFS_TEST_MNT"; then
    echo "EGGS-BOOT: ERRORE: File sorgente $SQFS_SRC è CORROTTO o non montabile!"
    dmesg | tail -n 10
    umount /mnt/ext4 || true
    cryptsetup close live-root || true
    /sbin/losetup -d "$LOOP_DEV" || true
    umount /mnt/live-media || true
    exit 1
fi
# Se siamo qui, il file è valido. Smontiamo il test.
umount "$SQFS_TEST_MNT"
echo "EGGS-BOOT: Verifica $SQFS_SRC OK."
# --- FINE BLOCCO DI VERIFICA ---

# 4. Prepara Destinazione RAM e COPIA
SQUASHFS_RAM_DIR="/run/squashfs_tmp"
SQUASHFS_RAM_PATH="${SQUASHFS_RAM_DIR}/filesystem.squashfs"
mkdir -p "$SQUASHFS_RAM_DIR"
# ... (Calcolo spazio e remount /run come prima) ...
NEEDED_SIZE_MB=$(( $(stat -c%s "$SQFS_SRC" 2>/dev/null || echo 3500000000) / 1024 / 1024 + 500 ))
echo "EGGS-BOOT: Spazio stimato per SquashFS in RAM: ${NEEDED_SIZE_MB} MB"
mount -o remount,size=${NEEDED_SIZE_MB}M /run || echo "EGGS-BOOT: WARN: Remount /run fallito."
df -h /run

echo "EGGS-BOOT: Copia $SQFS_SRC -> $SQUASHFS_RAM_PATH..."
if ! cp "$SQFS_SRC" "$SQUASHFS_RAM_PATH"; then
    echo "EGGS-BOOT: ERRORE: Copia squashfs in RAM fallita!"
    exit 1
fi
SQFS_SIZE=$(du -h "$SQUASHFS_RAM_PATH" | cut -f1)
echo "EGGS-BOOT: filesystem.squashfs ($SQFS_SIZE) copiato in RAM."

# 5. PULIZIA COMPLETA
# ... (umount /mnt/ext4, cryptsetup close, losetup -d, umount /mnt/live-media - come prima) ...
echo "EGGS-BOOT: Pulizia COMPLETA mount/device intermedi..."
umount /mnt/ext4 || echo "EGGS-BOOT: WARN: umount /mnt/ext4 failed ($?)"
cryptsetup close live-root || echo "EGGS-BOOT: WARN: cryptsetup close live-root failed ($?)"
/sbin/losetup -d "$LOOP_DEV" || echo "EGGS-BOOT: WARN: losetup -d $LOOP_DEV failed ($?)"
umount "$ORIG_MEDIA_MNT" || echo "EGGS-BOOT: WARN: umount ${ORIG_MEDIA_MNT} failed ($?)"
echo "EGGS-BOOT: Pulizia dischi completata."

# 6. Monta lo squashfs (dalla RAM)
SQFS_MNT="/rootfs"
mkdir -p "$SQFS_MNT"
echo "EGGS-BOOT: Montaggio $SQUASHFS_RAM_PATH su ${SQFS_MNT} (ro)..."
if ! mount -t squashfs -o ro,loop "$SQUASHFS_RAM_PATH" "$SQFS_MNT"; then
    echo "EGGS-BOOT: ERRORE: mount squashfs da RAM FALLITO! (Questo non dovrebbe succedere)"
    exit 1
fi
echo "EGGS-BOOT: SquashFS da RAM montato con successo su ${SQFS_MNT}."

# 7. Prepara e monta l'Overlay
# ... (come prima) ...
echo "EGGS-BOOT: Preparazione Overlay..."
OVL_UPPER="/run/overlay_upper"; OVL_WORK="/run/overlay_work"; FINAL_ROOT="/root"
mkdir -p "$OVL_UPPER" "$OVL_WORK" "$FINAL_ROOT"
echo "EGGS-BOOT: Montaggio Overlay su ${FINAL_ROOT}..."
if ! mount -t overlay overlay -o lowerdir=${SQFS_MNT},upperdir=${OVL_UPPER},workdir=${OVL_WORK} ${FINAL_ROOT}; then
    echo "EGGS-BOOT: ERRORE: Mount overlay fallito! (Exit Status: $?)."
    dmesg | tail -n 10
    exit 1
fi
echo "EGGS-BOOT: Overlay montato con successo su ${FINAL_ROOT}."

# 8. Esegui switch_root
# ... (come prima) ...
echo "EGGS-BOOT: Preparazione per switch_root..."
INIT_PATH="/sbin/init"; if [ ! -x "${FINAL_ROOT}${INIT_PATH}" ]; then INIT_PATH="/usr/lib/systemd/systemd"; fi
if [ ! -x "${FINAL_ROOT}${INIT_PATH}" ]; then echo "EGGS-BOOT: ERRORE: Init non trovato in ${FINAL_ROOT}!"; exit 1; fi
echo "EGGS-BOOT: Trovato init: ${INIT_PATH}"
echo "EGGS-BOOT: Esecuzione: exec switch_root ${FINAL_ROOT} ${INIT_PATH}"
exec 1>&- 2>&-
exec switch_root "${FINAL_ROOT}" "${INIT_PATH}"

echo "EGGS-BOOT: ERRORE CRITICO: switch_root fallito!" > /dev/console
exit 1