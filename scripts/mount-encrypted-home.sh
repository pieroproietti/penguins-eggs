#!/bin/bash
# This Bash script is used to unlock and mount a LUKS-encrypted home.img
# file for use as a /home directory, typically in a “live”
# operating system environment (booted from USB or DVD).
# v1.4 - Fixed 3-attempt loop by checking PIPESTATUS instead of pipe exit code.
#      - Replaced non-breaking spaces with regular spaces.

# enable echo
set -e

# configuration
HOME_IMG="__HOME_IMG_PATH__"
LUKS_NAME="live-home"
MOUNT_POINT="/home"

# define path OverlayFS
# we will use /run che è un tmpfs (in RAM)
LOWER_DIR="/run/live-home-lower"
UPPER_DIR="/run/live-home-upper"
WORK_DIR="/run/live-home-work"

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
    if mountpoint -q "$LOWER_DIR" 2>/dev/null; then
        umount "$LOWER_DIR" 2>/dev/null || true
    fi
    if [ -e "/dev/mapper/$LUKS_NAME" ]; then
        cryptsetup close "$LUKS_NAME" 2>/dev/null || true
    fi
    rmdir "$LOWER_DIR" "$UPPER_DIR" "$WORK_DIR" 2>/dev/null || true
}

trap cleanup EXIT

log "=== Starting encrypted home mount process (v1.4) ==="

# Check available memory
AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}')
log "Available memory: ${AVAILABLE_MEM}MB"

if [ "$AVAILABLE_MEM" -lt 1024 ]; then
    log_error "Low memory warning: only ${AVAILABLE_MEM}MB available"
    log "This might cause issues with LUKS operations"
fi

# Wait for the media to become available (max 30 seconds)
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
# disable 'set -e' to let 3 tempts
set +e

MAX_ATTEMPTS=3
ATTEMPT=1
UNLOCKED=0 # Flag per sapere se abbiamo sbloccato

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    log "Unlock attempt $ATTEMPT of $MAX_ATTEMPTS"
    
    # Check if Plymouth is active
    if plymouth --ping 2>/dev/null; then
        log "Plymouth active. Asking for password via Plymouth..."
        
        # Execute the command and check PIPESTATUS.
        plymouth ask-for-password --prompt="Enter passphrase for /home ($ATTEMPT/$MAX_ATTEMPTS)" | cryptsetup open "$HOME_IMG" "$LUKS_NAME" --key-file - 2>&1 | tee -a "$LOG_FILE"
        
        # Check the status of cryptsetup (index 1), not tee (index 2)
        # PIPESTATUS[0] = plymouth, [1] = cryptsetup, [2] = tee
        if [ ${PIPESTATUS[1]} -eq 0 ]; then
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
        echo "Please enter your passphrase to unlock your data ($ATTEMPT/$MAX_ATTEMPTS)"
        echo "(Press Ctrl+C to skip and continue with temporary home)"
        echo ""

        # Run the command and check PIPESTATUS
        cryptsetup open "$HOME_IMG" "$LUKS_NAME" 2>&1 | tee -a "$LOG_FILE"
        
        # Check the status of cryptsetup (index 0), not tee (index 1).
        # PIPESTATUS[0] = cryptsetup, [1] = tee
        if [ ${PIPESTATUS[0]} -eq 0 ]; then
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
# Enable echo
set -e

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

# Implementing OverlayFS
# 1. Create all necessary mount points and directories
log "Creating overlay directories..."
mkdir -p "$LOWER_DIR" "$UPPER_DIR" "$WORK_DIR" "$MOUNT_POINT"

# 2. Mount the decrypted volume as read-only as 'lowerdir'
log "Mounting decrypted volume to $LOWER_DIR (read-only base)"
if ! mount -o ro "/dev/mapper/$LUKS_NAME" "$LOWER_DIR" 2>&1 | tee -a "$LOG_FILE"; then
    log_error "Failed to mount decrypted volume (read-only) to $LOWER_DIR"
    exit 1
fi
log "Read-only base mounted successfully."

# 3. create overlay read-write for /home
log "Mounting overlay filesystem to $MOUNT_POINT"
OVERLAY_OPTS="lowerdir=$LOWER_DIR,upperdir=$UPPER_DIR,workdir=$WORK_DIR"
# Add “index=off” and “metacopy=off” for compatibility
OVERLAY_OPTS="$OVERLAY_OPTS,index=off,metacopy=off"

if ! mount -t overlay -o "$OVERLAY_OPTS" overlay "$MOUNT_POINT" 2>&1 | tee -a "$LOG_FILE"; then
    log_error "Failed to mount overlay filesystem to $MOUNT_POINT"
    # Try without extra options if it fails
    OVERLAY_OPTS="lowerdir=$LOWER_DIR,upperdir=$UPPER_DIR,workdir=$WORK_DIR"
    log "Retrying overlay mount with basic options..."
    if ! mount -t overlay -o "$OVERLAY_OPTS" overlay "$MOUNT_POINT" 2>&1 | tee -a "$LOG_FILE"; then
         log_error "Failed to mount overlay filesystem to $MOUNT_POINT (retry failed)"
         exit 1
    fi
fi
log "Writable overlay for /home mounted successfully."


# Restore users if they exists
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

    # Restore Display Manager configs for autologin
    log "Restoring display manager configurations (for autologin)..."
    
    # GDM (gdm3)
    if [ -d "$MOUNT_POINT/.system-backup/gdm3" ]; then
        log "Restoring GDM3 config..."
        # Remove the default live configuration before copying
        rm -rf /etc/gdm3 2>/dev/null
        cp -a "$MOUNT_POINT/.system-backup/gdm3" /etc/
    fi

    # GDM (gdm)
    if [ -d "$MOUNT_POINT/.system-backup/gdm" ]; then
        log "Restoring GDM config..."
        rm -rf /etc/gdm 2>/dev/null
        cp -a "$MOUNT_POINT/.system-backup/gdm" /etc/
    fi

    # LightDM
    if [ -d "$MOUNT_POINT/.system-backup/lightdm" ]; then
        log "Restoring LightDM config..."
        rm -rf /etc/lightdm 2>/dev/null
        cp -a "$MOUNT_POINT/.system-backup/lightdm" /etc/
    fi

    # SDDM
    if [ -f "$MOUNT_POINT/.system-backup/sddm.conf" ]; then
        log "Restoring SDDM config (sddm.conf)..."
        cp -a "$MOUNT_POINT/.system-backup/sddm.conf" /etc/
    fi
    if [ -d "$MOUNT_POINT/.system-backup/sddm.conf.d" ]; then
        log "Restoring SDDM config (sddm.conf.d)..."
        rm -rf /etc/sddm.conf.d 2>/dev/null
        cp -a "$MOUNT_POINT/.system-backup/sddm.conf.d" /etc/
    fi
    
    log "User accounts and DM configs restored successfully"
    
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
