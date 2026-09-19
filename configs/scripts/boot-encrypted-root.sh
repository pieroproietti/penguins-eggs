#!/bin/sh
# /scripts/live-premount/boot-encrypted-root.sh
#
# BELL: Boot Encrypted Linux Live
#
# Decrypts the LUKS container (root.img) so that live-boot can find
# filesystem.squashfs via the live-media=/dev/mapper/live-root boot parameter.

echo "BELL: Boot Encrypted Linux Live"

#################################################
# 1. Setup and Find Media

# 1.1 load modules
echo "BELL: loading modules..."
modprobe loop 2>/dev/null || true
modprobe dm_mod 2>/dev/null || true
modprobe dm_crypt 2>/dev/null || true
modprobe ext4 2>/dev/null || true
modprobe squashfs 2>/dev/null || true
sleep 2

# 1.2 find BELL media drive
echo "BELL: find BELL media drive..."
mkdir -p /mnt/live-media
BELL_MEDIA_MNT="/mnt/live-media"
LIVE_DEV=""

MAX_WAIT_DEV=20; COUNT_DEV=0
while [ -z "$LIVE_DEV" ] && [ $COUNT_DEV -lt $MAX_WAIT_DEV ]; do
    ls /dev > /dev/null
    for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do
        if [ ! -b "$dev" ]; then continue; fi
        if mount -o ro "$dev" "$BELL_MEDIA_MNT" 2>/dev/null; then
            if [ -f "${BELL_MEDIA_MNT}/live/root.img" ]; then
                echo "BELL: Found BELL media on $dev"
                LIVE_DEV=$dev
                break 2
            else
                umount "$BELL_MEDIA_MNT" 2>/dev/null || true
            fi
        fi
    done
    sleep 1
    COUNT_DEV=$((COUNT_DEV+1))
done

if [ -z "$LIVE_DEV" ]; then
    echo "BELL: Error: no live BELL drive found!"
    ls /dev
    exit 1
fi

ROOT_IMG="${BELL_MEDIA_MNT}/live/root.img"


#################################################
# 2. Prepare Encrypted Image

echo "BELL: loop device association for $ROOT_IMG..."
LOOP_DEV_OUTPUT=$(/sbin/losetup -f --show "$ROOT_IMG" 2>/dev/null); LOSETUP_EXIT_STATUS=$?
if [ $LOSETUP_EXIT_STATUS -ne 0 ] || [ -z "$LOOP_DEV_OUTPUT" ] || ! [ -b "$LOOP_DEV_OUTPUT" ]; then
    echo "BELL: Error: loop association failed!"
    exit 1
fi
LOOP_DEV="$LOOP_DEV_OUTPUT"
echo "BELL: loop device $ROOT_IMG associated to: $LOOP_DEV"


#################################################
# 3. Unlock LUKS (User Interaction)

MAX_ATTEMPTS=3
ATTEMPT=1
UNLOCKED=0

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do

    if plymouth --ping 2>/dev/null; then
        if plymouth ask-for-password --prompt="Enter passphrase ($ATTEMPT/$MAX_ATTEMPTS)" | cryptsetup open --readonly --key-file - "$LOOP_DEV" live-root; then
            UNLOCKED=1
            break
        else
            if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
                plymouth display-message --text="Incorrect passphrase. Try again..."
                sleep 2
            fi
        fi
    else
        echo "Please enter passphrase for $LOOP_DEV ($ATTEMPT/$MAX_ATTEMPTS):"
        if cryptsetup open --readonly "$LOOP_DEV" live-root; then
            UNLOCKED=1
            break
        else
            if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
                echo "Incorrect passphrase. Please try again."
            fi
        fi
    fi

    ATTEMPT=$((ATTEMPT + 1))
    sleep 1
done

if [ $UNLOCKED -eq 0 ]; then
    if plymouth --ping 2>/dev/null; then
        plymouth display-message --text="LUKS Unlock Failed: Max attempts reached"
        sleep 5
    fi
    /sbin/losetup -d "$LOOP_DEV" || true
    exit 1
fi

echo "BELL: LUKS unlocked ($LOOP_DEV -> live-root) [readonly]. Waiting for mapper..."


#################################################
# 4. Wait for mapper and hand off to live-boot

MAX_WAIT_MAP=10; COUNT_MAP=0
while [ ! -b /dev/mapper/live-root ] && [ $COUNT_MAP -lt $MAX_WAIT_MAP ]; do
    sleep 1
    COUNT_MAP=$((COUNT_MAP+1))
done

if [ ! -b /dev/mapper/live-root ]; then
    echo "BELL: Error: mapper did not appear."
    cryptsetup close live-root || true
    /sbin/losetup -d "$LOOP_DEV" || true
    exit 1
fi

echo "BELL: /dev/mapper/live-root ready. Handing off to live-boot."
exit 0
