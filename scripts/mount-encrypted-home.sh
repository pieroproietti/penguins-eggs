#!/bin/bash
# Script per sbloccare e montare home.img LUKS cifrato
# Con logging robusto e gestione errori

set -e

# Configurazione
HOME_IMG="__HOME_IMG_PATH__"
LUKS_NAME="live-home"
MOUNT_POINT="/home"
LOG_FILE="/var/log/mount-encrypted-home.log"

# Funzione di logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

# Cleanup in caso di errore
cleanup() {
    log "Cleanup in progress..."
    if mountpoint -q "$MOUNT_POINT" 2>/dev/null; then
        umount "$MOUNT_POINT" 2>/dev/null || true
    fi
    if [ -e "/dev/mapper/$LUKS_NAME" ]; then
        cryptsetup close "$LUKS_NAME" 2>/dev/null || true
    fi
}

trap cleanup EXIT

log "=== Starting encrypted home mount process ==="

# Verifica memoria disponibile
AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}')
log "Available memory: ${AVAILABLE_MEM}MB"

if [ "$AVAILABLE_MEM" -lt 1024 ]; then
    log_error "Low memory warning: only ${AVAILABLE_MEM}MB available"
    log "This might cause issues with LUKS operations"
fi

# Attendi che il media sia disponibile (max 30 secondi)
log "Waiting for live media to be available..."
COUNTER=0
while [ ! -f "$HOME_IMG" ] && [ $COUNTER -lt 30 ]; do
    sleep 1
    COUNTER=$((COUNTER + 1))
done

if [ ! -f "$HOME_IMG" ]; then
    log_error "home.img not found at $HOME_IMG after 30 seconds"
    log "Available mounts:"
    mount | grep live | tee -a "$LOG_FILE"
    exit 0
fi

log "Found home.img at $HOME_IMG"

# Copia in RAM se è su media read-only
TEMP_HOME_IMG="/tmp/home.img"
log "Copying home.img to RAM..."
cp "$HOME_IMG" "$TEMP_HOME_IMG"
HOME_IMG="$TEMP_HOME_IMG"
log "home.img copied to $HOME_IMG"

# Verifica dimensione file
IMG_SIZE=$(stat -c %s "$HOME_IMG")
log "home.img size: $((IMG_SIZE / 1024 / 1024))MB"

# Verifica dimensione file
IMG_SIZE=$(stat -c %s "$HOME_IMG")
log "home.img size: $((IMG_SIZE / 1024 / 1024))MB"

# Verifica se è un volume LUKS
if ! cryptsetup isLuks "$HOME_IMG" 2>&1 | tee -a "$LOG_FILE"; then
    log_error "$HOME_IMG is not a valid LUKS volume"
    exit 1
fi

log "Verified: home.img is a valid LUKS volume"

# Mostra prompt per la passphrase
echo ""
echo "╔════════════════════════════════════════╗"
echo "║  Encrypted Home Directory Detected     ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Please enter your passphrase to unlock your home directory"
echo "(Press Ctrl+C to skip and continue with temporary home)"
echo ""

# Tentativi multipli per la passphrase
MAX_ATTEMPTS=3
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    log "Unlock attempt $ATTEMPT of $MAX_ATTEMPTS"
    
    if cryptsetup open "$HOME_IMG" "$LUKS_NAME" 2>&1 | tee -a "$LOG_FILE"; then
        log "LUKS volume unlocked successfully"
        break
    else
        log_error "Failed to unlock LUKS volume (attempt $ATTEMPT)"
        
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            log_error "Maximum attempts reached. Continuing without encrypted home."
            echo ""
            echo "╔════════════════════════════════════════╗"
            echo "║  Failed to unlock encrypted home       ║"
            echo "║  System will continue with default     ║"
            echo "╚════════════════════════════════════════╝"
            echo ""
            sleep 3
            exit 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        echo "Incorrect passphrase. Please try again ($ATTEMPT/$MAX_ATTEMPTS)"
        echo ""
    fi
done

# Verifica che il device mapper esista
if [ ! -e "/dev/mapper/$LUKS_NAME" ]; then
    log_error "Device /dev/mapper/$LUKS_NAME not found after unlock"
    exit 1
fi

log "LUKS device available at /dev/mapper/$LUKS_NAME"

# Crea mount point
mkdir -p "$MOUNT_POINT"

# Monta il filesystem
log "Mounting decrypted volume to $MOUNT_POINT"
if mount "/dev/mapper/$LUKS_NAME" "$MOUNT_POINT" 2>&1 | tee -a "$LOG_FILE"; then
    log "Home directory mounted successfully"
else
    log_error "Failed to mount decrypted volume"
    cryptsetup close "$LUKS_NAME"
    exit 1
fi

# Ripristina gli utenti se esistono
if [ -d "$MOUNT_POINT/.system-backup" ]; then
    log "Restoring user accounts..."
    
    # Rimuovi utente live temporaneo
    if id live >/dev/null 2>&1; then
        log "Removing temporary 'live' user"
        userdel -r live 2>&1 | tee -a "$LOG_FILE" || true
    fi
    
    # Ripristina gli utenti
    if [ -f "$MOUNT_POINT/.system-backup/passwd" ]; then
        cat "$MOUNT_POINT/.system-backup/passwd" >> /etc/passwd
        log "Restored $(wc -l < "$MOUNT_POINT/.system-backup/passwd") user entries"
    fi
    
    if [ -f "$MOUNT_POINT/.system-backup/shadow" ]; then
        cat "$MOUNT_POINT/.system-backup/shadow" >> /etc/shadow
    fi
        
    # Ripristina gli utenti
    if [ -f "$MOUNT_POINT/.system-backup/passwd" ]; then
        cat "$MOUNT_POINT/.system-backup/passwd" >> /etc/passwd
        log "Restored $(wc -l < "$MOUNT_POINT/.system-backup/passwd") user entries"
    fi

    if [ -f "$MOUNT_POINT/.system-backup/shadow" ]; then
        cat "$MOUNT_POINT/.system-backup/shadow" >> /etc/shadow
    fi

    # Ripristina i gruppi (sostituisci completamente)
    if [ -f "$MOUNT_POINT/.system-backup/group" ]; then
        cp "$MOUNT_POINT/.system-backup/group" /etc/group
        log "Restored group memberships"
    fi

    if [ -f "$MOUNT_POINT/.system-backup/gshadow" ]; then
        cp "$MOUNT_POINT/.system-backup/gshadow" /etc/gshadow
    fi

    log "User accounts restored successfully"
    
    # Riavvia display manager per ricaricare gli utenti
    log "Restarting display manager..."
    if systemctl is-active --quiet gdm; then
        systemctl restart gdm 2>&1 | tee -a "$LOG_FILE"
        log "GDM restarted"
    elif systemctl is-active --quiet lightdm; then
        systemctl restart lightdm 2>&1 | tee -a "$LOG_FILE"
        log "LightDM restarted"
    elif systemctl is-active --quiet sddm; then
        systemctl restart sddm 2>&1 | tee -a "$LOG_FILE"
        log "SDDM restarted"
    else
        log "No active display manager found to restart"
    fi
fi

log "=== Encrypted home mount completed successfully ==="

# Non fare cleanup al successo
trap - EXIT

exit 0