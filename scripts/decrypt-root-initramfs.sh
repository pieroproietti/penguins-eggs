#!/bin/sh
# Script initramfs per sbloccare root.img cifrato
# Questo script viene eseguito in initramfs prima che live-boot cerchi filesystem.squashfs

PREREQ="udev"

prereqs()
{
    echo "$PREREQ"
}

case $1 in
prereqs)
    prereqs
    exit 0
    ;;
esac

# Carica funzioni comuni initramfs
. /scripts/functions

# Configurazione
ROOT_IMG_PATH="__ROOT_IMG_PATH__"
LUKS_NAME="live-home"
TEMP_ROOT_IMG="/run/initramfs/root.img"
TEMP_MOUNT="/run/initramfs/decrypted"

# Monta il media live usando il label
log_begin_msg "Mounting live media"
LIVE_DEV=$(blkid -l -t LABEL="__ISOIMAGE__" -o device)
if [ -n "$LIVE_DEV" ]; then
    mkdir -p /run/live/medium
    mount -o ro "$LIVE_DEV" /run/live/medium
    log_success_msg "Live media mounted on $LIVE_DEV"
else
    log_failure_msg "Live media not found"
    exit 0
fi
log_end_msg

log_begin_msg "Searching for encrypted root image"

# Attendi che il media sia disponibile (max 30 secondi)
COUNTER=0
while [ ! -f "$ROOT_IMG_PATH" ] && [ $COUNTER -lt 30 ]; do
    sleep 1
    COUNTER=$((COUNTER + 1))
done

if [ ! -f "$ROOT_IMG_PATH" ]; then
    log_failure_msg "root.img not found at $ROOT_IMG_PATH"
    log_end_msg
    # Continua il boot senza cifratura
    exit 0
fi

log_success_msg "Found encrypted root.img"

# Verifica che sia un volume LUKS
if ! /sbin/cryptsetup isLuks "$ROOT_IMG_PATH"; then
    log_failure_msg "root.img is not a valid LUKS volume"
    log_end_msg
    exit 0
fi

# Copia in RAM (il media è read-only)
log_begin_msg "Copying root.img to RAM (this may take a minute)..."
mkdir -p /run/initramfs
cp "$ROOT_IMG_PATH" "$TEMP_ROOT_IMG"
log_end_msg

# Mostra prompt per la passphrase
cat << 'EOF'

╔════════════════════════════════════════╗
║   Encrypted Live System Detected       ║
╚════════════════════════════════════════╝

Please enter your passphrase to unlock the system
(You have 3 attempts)

EOF

# Tentativi di sblocco
MAX_ATTEMPTS=3
ATTEMPT=1
UNLOCKED=0

while [ $ATTEMPT -le $MAX_ATTEMPTS ] && [ $UNLOCKED -eq 0 ]; do
    echo "Attempt $ATTEMPT of $MAX_ATTEMPTS:"
    
    # Chiudi device esistente se presente
    if [ -e "/dev/mapper/$LUKS_NAME" ]; then
        /sbin/cryptsetup close "$LUKS_NAME" 2>/dev/null || true
    fi
    
    if /sbin/cryptsetup open "$TEMP_ROOT_IMG" "$LUKS_NAME"; then
        UNLOCKED=1
        log_success_msg "LUKS volume unlocked successfully"
    else
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            echo "Incorrect passphrase. Please try again."
            echo ""
        fi
        ATTEMPT=$((ATTEMPT + 1))
    fi
done

if [ $UNLOCKED -eq 0 ]; then
    log_failure_msg "Failed to unlock after $MAX_ATTEMPTS attempts"
    log_warning_msg "System will continue without decryption"
    rm -f "$TEMP_ROOT_IMG"
    exit 0
fi

# Verifica che il device esista
if [ ! -e "/dev/mapper/$LUKS_NAME" ]; then
    log_failure_msg "Device /dev/mapper/$LUKS_NAME not found after unlock"
    rm -f "$TEMP_ROOT_IMG"
    exit 1
fi

# Monta il filesystem decifrato
log_begin_msg "Mounting decrypted volume"
mkdir -p "$TEMP_MOUNT"
if ! mount -o ro "/dev/mapper/$LUKS_NAME" "$TEMP_MOUNT"; then
    log_failure_msg "Failed to mount decrypted volume"
    /sbin/cryptsetup close "$LUKS_NAME"
    rm -f "$TEMP_ROOT_IMG"
    exit 1
fi
log_end_msg

# Verifica che filesystem.squashfs esista
if [ ! -f "$TEMP_MOUNT/filesystem.squashfs" ]; then
    log_failure_msg "filesystem.squashfs not found in decrypted volume"
    umount "$TEMP_MOUNT"
    /sbin/cryptsetup close "$LUKS_NAME"
    rm -f "$TEMP_ROOT_IMG"
    exit 1
fi

# Crea la directory /live se non esiste
mkdir -p /live

# Copia filesystem.squashfs dove live-boot si aspetta di trovarlo
log_begin_msg "Extracting filesystem.squashfs for live-boot"
cp "$TEMP_MOUNT/filesystem.squashfs" /live/filesystem.squashfs
log_end_msg

# Cleanup (ma lascia il device mapper aperto - serve per il sistema)
umount "$TEMP_MOUNT"
# NON chiudere cryptsetup - il device serve ancora

log_success_msg "Encrypted root successfully prepared"
log_success_msg "Live-boot will now continue with decrypted filesystem"

exit 0