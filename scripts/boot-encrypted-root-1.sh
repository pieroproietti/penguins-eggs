#!/bin/sh
# /scripts/live-premount/boot-encrypted-root.sh
# Minimal RAM Copy + plymouth, 3 tempts

set -e

# --- Logging Setup ---
LOGFILE="/tmp/eggs-premount-boot.log"; FIFO="/tmp/live-bell.fifo"; rm -f "$LOGFILE" "$FIFO"; mkfifo "$FIFO" || exit 1; tee -a "$LOGFILE" < "$FIFO" & TEE_PID=$!; exec > "$FIFO" 2>&1; trap 'echo "live-bell: Cleanup trap"; rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null || true; exit' EXIT INT TERM
# --- Logging End ---

echo "live-bell: =========================================="
echo "live-bell: boot encrypted linux live"
echo "live-bell: =========================================="

# Moduli necessari
echo "live-bell: loading modules..."
modprobe loop 2>/dev/null || true
modprobe dm_mod 2>/dev/null || true
modprobe dm_crypt 2>/dev/null || true
modprobe overlay 2>/dev/null || true
modprobe ext4 2>/dev/null || true
modprobe squashfs 2>/dev/null || true
sleep 2

# 1. find live boot 
echo "live-bell: fing boot encrypted linux live..."
mkdir -p /mnt/live-media /mnt/ext4
ORIG_MEDIA_MNT="/mnt/live-media"
LIVE_DEV=""
# ... [Codice ricerca live media] ...
MAX_WAIT_DEV=20; COUNT_DEV=0
while [ -z "$LIVE_DEV" ] && [ $COUNT_DEV -lt $MAX_WAIT_DEV ]; do ls /dev > /dev/null; for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do if [ ! -b "$dev" ]; then continue; fi; if mount -o ro "$dev" "$ORIG_MEDIA_MNT" 2>/dev/null; then if [ -f "${ORIG_MEDIA_MNT}/live/root.img" ]; then echo "live-bell: Found Original Live media on $dev"; LIVE_DEV=$dev; break 2; else umount "$ORIG_MEDIA_MNT" 2>/dev/null || true; fi; fi; done; sleep 1; COUNT_DEV=$((COUNT_DEV+1)); done
if [ -z "$LIVE_DEV" ]; then echo "live-bell: ERRORE: Live media originale non trovato!"; ls /dev; exit 1; fi

ROOT_IMG_RO="${ORIG_MEDIA_MNT}/live/root.img"
RAM_MEDIA_MNT="/run/live/medium" # Destinazione finale in RAM

# 2a. Associa loop device (per definire $LOOP_DEV)
echo "live-bell: Associazione loop device per $ROOT_IMG_RO..."
LOOP_DEV_OUTPUT=$(/sbin/losetup -f --show "$ROOT_IMG_RO" 2>/dev/null); LOSETUP_EXIT_STATUS=$?
if [ $LOSETUP_EXIT_STATUS -ne 0 ] || [ -z "$LOOP_DEV_OUTPUT" ] || ! [ -b "$LOOP_DEV_OUTPUT" ]; then echo "live-bell: ERRORE: Associazione loop fallita!"; exit 1; fi
LOOP_DEV="$LOOP_DEV_OUTPUT"
echo "live-bell: Loop device associato: $LOOP_DEV"

# 2b. Sblocca LUKS (con supporto Plymouth e 3 tentativi)
echo "live-bell: Sblocco LUKS $LOOP_DEV (readonly)..."

# Disabilita 'set -e' temporaneamente per gestire i fallimenti della password
set +e
MAX_ATTEMPTS=3
ATTEMPT=1
UNLOCKED=0

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    log "live-bell: Tentativo sblocco $ATTEMPT di $MAX_ATTEMPTS"
    
    # Controlla se Plymouth è attivo
    if plymouth --ping 2>/dev/null; then
        log "live-bell: Plymouth attivo. Chiedo password via Plymouth..."
        
        # Chiedi la password a Plymouth e passala a cryptsetup via stdin (--key-file -)
        if plymouth ask-for-password --prompt="Enter passphrase ($ATTEMPT/$MAX_ATTEMPTS)" | cryptsetup open --readonly --key-file - "$LOOP_DEV" live-root; then
            log "live-bell: Sblocco LUKS via Plymouth riuscito."
            UNLOCKED=1
            break
        else
            log "live-bell: ERRORE: Sblocco LUKS via Plymouth fallito (Tentativo $ATTEMPT)."
            if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
                 plymouth display-message --text="Incorrect passphrase. Try again..."
                 sleep 2 # Dà tempo di leggere il messaggio
            fi
        fi
    else
        # Fallback: Plymouth non attivo
        log "live-bell: Plymouth non attivo. Chiedo password via console..."
        echo "Please enter passphrase for $LOOP_DEV ($ATTEMPT/$MAX_ATTEMPTS):"
        
        if cryptsetup open --readonly "$LOOP_DEV" live-root; then
            log "live-bell: Sblocco LUKS (console) riuscito."
            UNLOCKED=1
            break
        else
            log "live-bell: ERRORE: Sblocco LUKS (console) fallito (Tentativo $ATTEMPT)."
            if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
                echo "Incorrect passphrase. Please try again."
            fi
        fi
    fi

    ATTEMPT=$((ATTEMPT + 1))
    sleep 1
done

# Riabilita 'set -e'
set -e

# Controlla se tutti i tentativi sono falliti
if [ $UNLOCKED -eq 0 ]; then
    log "live-bell: ERRORE: Numero massimo tentativi raggiunto."
    if plymouth --ping 2>/dev/null; then
        plymouth display-message --text="LUKS Unlock Failed: Max attempts reached"
        sleep 5
    fi
    /sbin/losetup -d "$LOOP_DEV" || true
    exit 1
fi

echo "live-bell: LUKS sbloccato ($LOOP_DEV -> live-root) [readonly]. Attesa mapper..."

# ... (Resto dello script v2.1: 2c, 2d, 3, 4, 5, 6, 7 - come prima) ...
# 2c. Attesa mapper
MAX_WAIT_MAP=10; COUNT_MAP=0; while [ ! -b /dev/mapper/live-root ] && [ $COUNT_MAP -lt $MAX_WAIT_MAP ]; do sleep 1; COUNT_MAP=$((COUNT_MAP+1)); done
if [ ! -b /dev/mapper/live-root ]; then echo "live-bell: ERRORE: Mapper non apparso."; cryptsetup close live-root || true; /sbin/losetup -d "$LOOP_DEV" || true; exit 1; fi

# 2d. Montaggio ext4
echo "live-bell: Montaggio ext4..."
mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4

SQFS_SRC="/mnt/ext4/filesystem.squashfs"
if [ ! -f "$SQFS_SRC" ]; then echo "live-bell: ERRORE: $SQFS_SRC non trovato!"; exit 1; fi

# 3. Prepara Destinazione RAM (ORA calcoliamo la dimensione GIUSTA)
echo "live-bell: Preparazione RAM disk ${RAM_MEDIA_MNT}..."
SQFS_SIZE_BYTES=$(stat -c%s "$SQFS_SRC")
NEEDED_SIZE_MB=$(( $SQFS_SIZE_BYTES / 1024 / 1024 + 500 )) # Aggiunge 500MB buffer
echo "live-bell: Spazio stimato necessario in /run: ${NEEDED_SIZE_MB} MB"
echo "live-bell: Aumento dimensione /run (tmpfs)..."
if ! mount -o remount,size=${NEEDED_SIZE_MB}M /run; then
    echo "live-bell: WARN: Remount /run fallito, spazio potrebbe essere insufficiente."
    df -h /run
fi
mkdir -p "${RAM_MEDIA_MNT}/live"

# 4. Copia SOLO filesystem.squashfs in RAM
SQFS_DEST="${RAM_MEDIA_MNT}/live/filesystem.squashfs"
echo "live-bell: Copia $SQFS_SRC -> $SQFS_DEST..."
if command -v rsync >/dev/null; then
    rsync -a --info=progress2 "$SQFS_SRC" "$SQFS_DEST"
else
    cp "$SQFS_SRC" "$SQFS_DEST"
fi
SQFS_SIZE=$(du -h "$SQFS_DEST" | cut -f1)
echo "live-bell: filesystem.squashfs ($SQFS_SIZE) copiato in RAM."

# 5. Copia i metadati essenziali del medium in RAM
echo "live-bell: Copia metadati (.disk, kernel, initrd) da ${ORIG_MEDIA_MNT}..."

# Copia .disk (essenziale per live-boot)
if [ -d "${ORIG_MEDIA_MNT}/.disk" ]; then
    cp -a "${ORIG_MEDIA_MNT}/.disk" "${RAM_MEDIA_MNT}/"
    echo "live-bell: .disk copiato."
else
    echo "live-bell: WARN: Directory .disk non trovata sul media originale."
fi

# Copia kernel e initrd (utili per l'installer)
echo "live-bell: Copia vmlinuz* e initrd*..."
cp -a "${ORIG_MEDIA_MNT}/live/vmlinuz"* "${RAM_MEDIA_MNT}/live/" 2>/dev/null || true
cp -a "${ORIG_MEDIA_MNT}/live/initrd"* "${RAM_MEDIA_MNT}/live/" 2>/dev/null || true
echo "live-bell: Copia kernel/initrd tentata (eventuali errori ignorati)."

# 6. Pulizia Mount/Device Intermedi
echo "live-bell: Pulizia mount/device intermedi..."
umount /mnt/ext4 || echo "live-bell: WARN: umount /mnt/ext4 failed ($?)"
cryptsetup close live-root || echo "live-bell: WARN: cryptsetup close live-root failed ($?)"
/sbin/losetup -d "$LOOP_DEV" || echo "live-bell: WARN: losetup -d $LOOP_DEV failed ($?)"
umount "$ORIG_MEDIA_MNT" || echo "live-bell: WARN: umount ${ORIG_MEDIA_MNT} failed ($?)"
echo "live-bell: Pulizia completata."

# 7. Passa il Testimone a live-boot
echo "live-bell: =========================================="
echo "live-bell: Medium live MINIMALE ricostruito in RAM su ${RAM_MEDIA_MNT}"
ls -l "$RAM_MEDIA_MNT"
ls -l "${RAM_MEDIA_MNT}/live"
echo "live-bell: Lascio che live-boot continui (con 'live-media=/run/live/medium')..."
echo "live-bell: =========================================="
exit 0