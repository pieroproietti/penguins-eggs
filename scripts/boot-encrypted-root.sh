#!/bin/sh
# /scripts/live-premount/boot-encrypted-root.sh
#
# This script is designed to Boot Encrypted Linux Live (BELL).
#
# Its main purpose is to find an encrypted root image file (root.img) 
# on a live USB/DVD, ask the user for a passphrase to unlock it, 
# and then copy the main system filesystem (filesystem.squashfs) 
# from inside the encrypted image into RAM.
# 
# the process continue with standard live-boot 

set -e

# --- Logging Setup ---
LOGFILE="/tmp/bell.log"; FIFO="/tmp/BELL.fifo"; rm -f "$LOGFILE" "$FIFO"; mkfifo "$FIFO" || exit 1; tee -a "$LOGFILE" < "$FIFO" & TEE_PID=$!; exec > "$FIFO" 2>&1; trap 'echo "BELL: Cleanup trap"; rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null || true; exit' EXIT INT TERM
# --- Logging End ---

echo "BELL: =========================================="
echo "BELL: Boot Encrypted Linux Live"
echo "BELL: =========================================="

#################################################
# 1. Setup and Find Media

# 1.1 load modules
modprobe loop 2>/dev/null || true
modprobe dm_mod 2>/dev/null || true
modprobe dm_crypt 2>/dev/null || true
modprobe overlay 2>/dev/null || true
modprobe ext4 2>/dev/null || true
modprobe squashfs 2>/dev/null || true
sleep 2


# 1.2 Find Live Drive
echo "BELL: find live drive..."
mkdir -p /mnt/live-media /mnt/ext4
BELL_MEDIA_MNT="/mnt/live-media"
LIVE_DEV=""

# find to max 20 devices
MAX_WAIT_DEV=20; COUNT_DEV=0
while [ -z "$LIVE_DEV" ] && [ $COUNT_DEV -lt $MAX_WAIT_DEV ]; do ls /dev > /dev/null; for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do if [ ! -b "$dev" ]; then continue; fi; if mount -o ro "$dev" "$BELL_MEDIA_MNT" 2>/dev/null; then if [ -f "${BELL_MEDIA_MNT}/live/root.img" ]; then echo "BELL: Found Original Live media on $dev"; LIVE_DEV=$dev; break 2; else umount "$BELL_MEDIA_MNT" 2>/dev/null || true; fi; fi; done; sleep 1; COUNT_DEV=$((COUNT_DEV+1)); done
if [ -z "$LIVE_DEV" ]; then echo "BELL: Error: no BELL image found!"; ls /dev; exit 1; fi

ROOT_IMG_RO="${BELL_MEDIA_MNT}/live/root.img"
RAM_MEDIA_MNT="/run/live/medium" # final destination in RAM


#################################################
# 2. Prepare Encrypted Image

# 2.1 loop device
echo "BELL: loop device association for $ROOT_IMG_RO..."
LOOP_DEV_OUTPUT=$(/sbin/losetup -f --show "$ROOT_IMG_RO" 2>/dev/null); LOSETUP_EXIT_STATUS=$?
if [ $LOSETUP_EXIT_STATUS -ne 0 ] || [ -z "$LOOP_DEV_OUTPUT" ] || ! [ -b "$LOOP_DEV_OUTPUT" ]; then echo "BELL: ERRORE: Associazione loop fallita!"; exit 1; fi
LOOP_DEV="$LOOP_DEV_OUTPUT"
echo "BELL: loop device associated to: $LOOP_DEV"



#################################################
# 3. Unlock LUKS (User Interaction)

# disable 'set -e' to let 3 tempts 
set +e
MAX_ATTEMPTS=3
ATTEMPT=1
UNLOCKED=0

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    log "BELL: unblocking attempt $ATTEMPT of $MAX_ATTEMPTS"
    
    # check if plymouth is active
    if plymouth --ping 2>/dev/null; then
        log "BELL: plymouth active. Request password via Plymouth..."
        
        # request the password in plymouth and pass it to cryptsetup via stdin (--key-file -)
        if plymouth ask-for-password --prompt="Enter passphrase ($ATTEMPT/$MAX_ATTEMPTS)" | cryptsetup open --readonly --key-file - "$LOOP_DEV" live-root; then
            log "BELL: LUKS unlock via plymouth successful."
            UNLOCKED=1
            break
        else
            log "BELL: Error: LUKS unlock (via plymouth) failed (attempt $ATTEMPT)."
            if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
                 plymouth display-message --text="Incorrect passphrase. Try again..."
                 sleep 2 # wait 2 seconds to read message
            fi
        fi
    else
        # Fallback: Plymouth not active
        log "BELL: Plymouth not active. Asking password via console..."
        echo "Please enter passphrase for $LOOP_DEV ($ATTEMPT/$MAX_ATTEMPTS):"
        
        if cryptsetup open --readonly "$LOOP_DEV" live-root; then
            log "BELL: LUKS unlock (via console) successful."
            UNLOCKED=1
            break
        else
            log "BELL: ERRORE: Error: LUKS unlock via console failed (attempt $ATTEMPT)."
            if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
                echo "Incorrect passphrase. Please try again."
            fi
        fi
    fi

    ATTEMPT=$((ATTEMPT + 1))
    sleep 1
done

# Enable 'set -e'
set -e

# check if all attempts have failed
if [ $UNLOCKED -eq 0 ]; then
    log "BELL: Error: Maximum number of attempts reached."
    if plymouth --ping 2>/dev/null; then
        plymouth display-message --text="LUKS Unlock Failed: Max attempts reached"
        sleep 5
    fi
    /sbin/losetup -d "$LOOP_DEV" || true
    exit 1
fi

echo "BELL: LUKS unlocked ($LOOP_DEV -> live-root) [readonly]. Waiting for mapper..."


#################################################
# 4. copy System to RAM

# 4.1 waiting mapper
MAX_WAIT_MAP=10; COUNT_MAP=0; while [ ! -b /dev/mapper/live-root ] && [ $COUNT_MAP -lt $MAX_WAIT_MAP ]; do sleep 1; COUNT_MAP=$((COUNT_MAP+1)); done
if [ ! -b /dev/mapper/live-root ]; then echo "BELL: Error: mapper did not appear."; cryptsetup close live-root || true; /sbin/losetup -d "$LOOP_DEV" || true; exit 1; fi

# 4.2 mount ext4 filesystem
echo "BELL: mounting ext4 filesystem..."
mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4

SQFS_SRC="/mnt/ext4/filesystem.squashfs"
if [ ! -f "$SQFS_SRC" ]; then echo "BELL: error: $SQFS_SRC not found!"; exit 1; fi


# 4.3. Prepare RAM destination /run
echo "BELL: preparing RAM disk ${RAM_MEDIA_MNT}..."
SQFS_SIZE_BYTES=$(stat -c%s "$SQFS_SRC")
NEEDED_SIZE_MB=$(( $SQFS_SIZE_BYTES / 1024 / 1024 + 500 )) # add 500MB buffer
echo "BELL: Estimated space required in /run: ${NEEDED_SIZE_MB} MB"
echo "BELL: increase size /run (tmpfs)..."
if ! mount -o remount,size=${NEEDED_SIZE_MB}M /run; then
    echo "BELL: WARN: Remount /run failed, space may be insufficient."
    df -h /run
fi
mkdir -p "${RAM_MEDIA_MNT}/live"

# 4.4 copy ONLY filesystem.squashfs to RAM
SQFS_DEST="${RAM_MEDIA_MNT}/live/filesystem.squashfs"
echo "BELL: Copia $SQFS_SRC -> $SQFS_DEST..."
if command -v rsync >/dev/null; then
    rsync -a --info=progress2 "$SQFS_SRC" "$SQFS_DEST"
else
    cp "$SQFS_SRC" "$SQFS_DEST"
fi
SQFS_SIZE=$(du -h "$SQFS_DEST" | cut -f1)
echo "BELL: filesystem.squashfs ($SQFS_SIZE) copied to RAM."

# 4.5 copy .disk
if [ -d "${BELL_MEDIA_MNT}/.disk" ]; then
    cp -a "${BELL_MEDIA_MNT}/.disk" "${RAM_MEDIA_MNT}/"
    echo "BELL: .disk copied."
else
    echo "BELL: WARN: .disk not found."
fi

# 4.6 Copy vmlinuz and initrd (we need to install the system)
cp -a "${BELL_MEDIA_MNT}/live/vmlinuz"* "${RAM_MEDIA_MNT}/live/" 2>/dev/null || true
cp -a "${BELL_MEDIA_MNT}/live/initrd"* "${RAM_MEDIA_MNT}/live/" 2>/dev/null || true
echo "BELL: Attempted kernel/initrd copy (any errors ignored)."


#################################################
# 6. Cleanup and Hand-off
echo "BELL: cleaning used mounts and devices..."
umount /mnt/ext4 || echo "BELL: WARN: umount /mnt/ext4 failed ($?)"
cryptsetup close live-root || echo "BELL: WARN: cryptsetup close live-root failed ($?)"
/sbin/losetup -d "$LOOP_DEV" || echo "BELL: WARN: losetup -d $LOOP_DEV failed ($?)"
umount "$BELL_MEDIA_MNT" || echo "BELL: WARN: umount ${BELL_MEDIA_MNT} failed ($?)"
echo "BELL: cleaning complete."


# 6.1 switching to live boot
echo "BELL: =========================================="
echo "BELL: live ISO image built in RAM on ${RAM_MEDIA_MNT}"
#ls -l "$RAM_MEDIA_MNT"
#ls -l "${RAM_MEDIA_MNT}/live"
echo "BELL: control pass to live-boot"
echo "BELL: =========================================="
exit 0