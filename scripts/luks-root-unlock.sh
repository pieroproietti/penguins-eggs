#!/bin/bash
# luks-root-unlock.sh
# Script che sblocca il root cifrato e fa switch al sistema reale

set -e

echo ""
echo "=========================================="
echo "  Encrypted Root Unlock"
echo "=========================================="
echo ""

# Crea mountpoint
mkdir -p /mnt/live-media
mkdir -p /mnt/root-img
mkdir -p /mnt/real-root
mkdir -p /newroot

# Trova live media
echo "Searching for live media..."
FOUND=0

for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do
    [ -b "$dev" ] || continue
    
    echo "  Trying $dev..."
    
    if mount -o ro "$dev" /mnt/live-media 2>/dev/null; then
        if [ -f /mnt/live-media/live/root.img ]; then
            echo "  ✓ Found live media on $dev"
            FOUND=1
            break
        fi
        umount /mnt/live-media 2>/dev/null
    fi
done

if [ $FOUND -eq 0 ]; then
    echo ""
    echo "✗ ERROR: Could not find live media with root.img"
    echo ""
    echo "Available block devices:"
    lsblk
    echo ""
    echo "Dropping to emergency shell..."
    echo "You can try to mount manually and run this script again."
    exec /bin/bash
fi

ROOT_IMG="/mnt/live-media/live/root.img"

# Verifica LUKS
if ! cryptsetup isLuks "$ROOT_IMG"; then
    echo "✗ ERROR: root.img is not a LUKS volume"
    echo ""
    file "$ROOT_IMG"
    exec /bin/bash
fi

# Unlock con retry
echo ""
echo "Found encrypted root.img"
echo ""

MAX_ATTEMPTS=3
for attempt in $(seq 1 $MAX_ATTEMPTS); do
    echo "Enter passphrase to unlock (attempt $attempt of $MAX_ATTEMPTS):"
    
    if cryptsetup open "$ROOT_IMG" live-root; then
        echo ""
        echo "✓ Unlocked successfully!"
        break
    fi
    
    if [ $attempt -eq $MAX_ATTEMPTS ]; then
        echo ""
        echo "✗ Failed after $MAX_ATTEMPTS attempts"
        echo "Dropping to shell..."
        exec /bin/bash
    fi
    
    echo "✗ Wrong passphrase, try again..."
    echo ""
done

# Mount decrypted volume
echo ""
echo "Mounting decrypted volume..."
if ! mount -t ext4 -o ro /dev/mapper/live-root /mnt/root-img; then
    echo "✗ ERROR: Failed to mount decrypted volume"
    cryptsetup close live-root
    exec /bin/bash
fi

# Mount real filesystem
echo "Mounting real filesystem..."
if ! mount -t squashfs -o ro,loop /mnt/root-img/filesystem.squashfs /mnt/real-root; then
    echo "✗ ERROR: Failed to mount real filesystem"
    umount /mnt/root-img
    cryptsetup close live-root
    exec /bin/bash
fi

# Create overlay
echo "Creating writable overlay..."
mkdir -p /run/overlay-upper
mkdir -p /run/overlay-work

if ! mount -t overlay overlay \
    -o lowerdir=/mnt/real-root,upperdir=/run/overlay-upper,workdir=/run/overlay-work \
    /newroot; then
    echo "✗ ERROR: Failed to mount overlay"
    umount /mnt/real-root
    umount /mnt/root-img
    cryptsetup close live-root
    exec /bin/bash
fi

echo "✓ Overlay mounted successfully"

# Verify init
if [ ! -x /newroot/sbin/init ] && [ ! -x /newroot/usr/lib/systemd/systemd ]; then
    echo "✗ ERROR: No valid init found in real root"
    echo ""
    echo "Contents of /newroot:"
    ls -la /newroot/ | head -20
    exec /bin/bash
fi

# Switch root usando systemd
echo ""
echo "✓ Real root ready!"
echo "Switching to real system..."
echo ""

sleep 2

# Usa systemctl per switch-root (metodo raccomandato con systemd)
exec systemctl --no-block switch-root /newroot /sbin/init
