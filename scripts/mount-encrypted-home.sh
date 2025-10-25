#!/bin/bash
# This Bash script is used to unlock and mount a LUKS-encrypted home.img 
# file for use as a /home directory, typically in a “live” 
# operating system environment (booted from USB or DVD).
# v1.1 

set -e

# configuration
HOME_IMG="__HOME_IMG_PATH__"
LUKS_NAME="live-home"
MOUNT_POINT="/home"
LOG_FILE="/var/log/mount-encrypted-home.log"

# logging
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
    # If we copied to RAM, we remove the copy
    if [ "$HOME_IMG" = "/var/tmp/home.img" ]; then
        rm -f /var/tmp/home.img 2>/dev/null || true
        log "Removed temporary home.img from /var/tmp"
    fi
}

trap cleanup EXIT

log "=== Starting encrypted home mount process (v1.1) ==="

# Check available memory
AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}')
log "Available memory: ${AVAILABLE_MEM}MB"

if [ "$AVAILABLE_MEM" -lt 1024 ]; then
    log_error "Low memory warning: only ${AVAILABLE_MEM}MB available"
    log "This might cause issues with LUKS operations"
fi

# Wait for the media to become available (max 30 seconds)
log "Waiting for live media to be available..."
ORIG_HOME_IMG="$HOME_IMG" # Save the original path
COUNTER=0
while [ ! -f "$ORIG_HOME_IMG" ] && [ $COUNTER -lt 30 ]; do
    sleep 1
    COUNTER=$((COUNTER + 1))
done

if [ ! -f "$ORIG_HOME_IMG" ]; then
    log_error "home.img not found at $ORIG_HOME_IMG after 30 seconds"
    log "Available mounts:"
    mount | grep live | tee -a "$LOG_FILE"
    exit 0
fi

log "Found home.img at $ORIG_HOME_IMG"

# Copy to RAM if it is on read-only media
# Note: /var/tmp is on overlay (tmpfs), so it is in RAM.
TEMP_HOME_IMG="/var/tmp/home.img"
log "Copying home.img to RAM..."
cp "$ORIG_HOME_IMG" "$TEMP_HOME_IMG"
HOME_IMG="$TEMP_HOME_IMG" # Da ora in poi usiamo la copia in RAM
log "home.img copied to $HOME_IMG"

# Check file size
IMG_SIZE=$(stat -c %s "$HOME_IMG")
log "home.img size: $((IMG_SIZE / 1024 / 1024))MB"

# Check if it is a LUKS volume
if ! cryptsetup isLuks "$HOME_IMG" 2>&1 | tee -a "$LOG_FILE"; then
    log_error "$HOME_IMG is not a valid LUKS volume"
    exit 1
fi

log "Verified: home.img is a valid LUKS volume"

# Wait until the TTY is fully initialized
sleep 2

# Clean up any previous device mappers
if [ -e "/dev/mapper/$LUKS_NAME" ]; then
    log "LUKS device already exists, closing it first..."
    cryptsetup close "$LUKS_NAME" 2>&1 | tee -a "$LOG_FILE" || true
fi

# PASSWORD REQUEST
MAX_ATTEMPTS=3
ATTEMPT=1
UNLOCKED=0 # Flag per sapere se abbiamo sbloccato

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    log "Unlock attempt $ATTEMPT of $MAX_ATTEMPTS"
    
    # Check if Plymouth is active
    if plymouth --ping 2>/dev/null; then
        log "Plymouth active. Asking for password via Plymouth..."
        
        # ask-for-password, get password a cryptsetup via stdin
        if plymouth ask-for-password --prompt="Enter passphrase for /home ($ATTEMPT/$MAX_ATTEMPTS)" | cryptsetup open "$HOME_IMG" "$LUKS_NAME" --key-file - 2>&1 | tee -a "$LOG_FILE"; then
            log "LUKS volume unlocked successfully via Plymouth"
            UNLOCKED=1
            break
        else
            log_error "Failed to unlock LUKS volume via Plymouth (attempt $ATTEMPT)"
            if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
                 plymouth display-message --text="Incorrect passphrase. Try again..."
                 sleep 2 # Gives time to read the message
            fi
        fi
    else
        # Fallback: Plymouth not active. asking for password via console
        log "Plymouth not active. Asking for password via console..."
        
        echo ""
        echo "╔════════════════════════════════════════╗"
        echo "║  Encrypted Home Directory Detected     ║"
        echo "╚════════════════════════════════════════╝"
        echo ""
        echo "Please enter your passphrase to unlock your home directory ($ATTEMPT/$MAX_ATTEMPTS)"
        echo "(Press Ctrl+C to skip and continue with temporary home)"
        echo ""

        if cryptsetup open "$HOME_IMG" "$LUKS_NAME" 2>&1 | tee -a "$LOG_FILE"; then
            log "LUKS volume unlocked successfully via console"
            UNLOCKED=1
            break
        else
            log_error "Failed to unlock LUKS volume (attempt $ATTEMPT)"
            if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
                echo "Incorrect passphrase. Please try again."
            fi
        fi
    fi

    ATTEMPT=$((ATTEMPT + 1))
done


# Check if unlocking failed after all attempts
if [ $UNLOCKED -eq 0 ]; then
    log_error "Maximum attempts reached. Continuing without encrypted home."
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║  Failed to unlock encrypted home       ║"
    echo "║  System will continue with default     ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    
    if plymouth --ping 2>/dev/null; then
        plymouth display-message --text="Failed to unlock. Continuing with temporary home..."
        sleep 3
        plymouth quit
    fi
    
    sleep 3
    exit 0 # Exits without error, allowing the system to continue
fi

# Verify that the device mapper exists
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
    # cryptsetup close è gestito dalla trap 'cleanup'
    exit 1
fi

# Remove the copy in RAM, it is no longer needed
log "Cleaning up temporary copy: $HOME_IMG"
rm -f "$HOME_IMG" 2>/dev/null || true

# Restore users if they exist
if [ -d "$MOUNT_POINT/.system-backup" ]; then
    log "Restoring user accounts..."
    
    # Remove temporary live user
    if id live >/dev/null 2>&1; then
        log "Removing temporary 'live' user"
        userdel -r live 2>&1 | tee -a "$LOG_FILE" || true
    fi
    
    # Restore users
    if [ -f "$MOUNT_POINT/.system-backup/passwd" ]; then
        cat "$MOUNT_POINT/.system-backup/passwd" >> /etc/passwd
        log "Restored $(wc -l < "$MOUNT_POINT/.system-backup/passwd") user entries"
    fi
    
    if [ -f "$MOUNT_POINT/.system-backup/shadow" ]; then
        cat "$MOUNT_POINT/.system-backup/shadow" >> /etc/shadow
    fi

    # Restore groups (replace completely)
    if [ -f "$MOUNT_POINT/.system-backup/group" ]; then
        cp "$MOUNT_POINT/.system-backup/group" /etc/group
        log "Restored group memberships"
    fi

    if [ -f "$MOUNT_POINT/.system-backup/gshadow" ]; then
        cp "$MOUNT_POINT/.system-backup/gshadow" /etc/gshadow
    fi

    log "User accounts restored successfully"
    
    # Restart the display manager to reload users
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
else
    log "No .system-backup directory found. Assuming /home is just data."
fi

log "=== Encrypted home mount completed successfully ==="

# Notify Plymouth (if active) that we are done
if plymouth --ping 2>/dev/null; then
    plymouth quit
fi

# Don't clean up success
trap - EXIT

exit 0