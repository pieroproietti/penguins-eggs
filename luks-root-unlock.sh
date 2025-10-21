#!/bin/bash
# luks-root-unlock.sh
# Versione Chroot: Monta l'ISO (ro), l'ext4 (ro), lo squashfs (ro)
# e crea un overlay scrivibile in RAM.

set -e

echo ""
echo "=========================================="
echo "  Encrypted Root Unlock (CHROOT MODE)"
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
for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*;
do
    [ -b "$dev" ] || continue
    echo "  Trying $dev..."
    if mount -o ro "$dev" /mnt/live-media 2>/dev/null;
    then
        if [ -f /mnt/live-media/live/root.img ];
        then
            echo "  ✓ Found live media on $dev"
            FOUND=1
            break
        fi
        umount /mnt/live-media 2>/dev/null
    fi
done

if [ $FOUND -eq 0 ]; then
    echo ""
    echo "✗ ERROR: Could not find live media"
    lsblk
    echo "Dropping to emergency shell..."
    exec /bin/bash
fi

# Usa il root.img originale dall'ISO (read-only)
ROOT_IMG="/mnt/live-media/live/root.img"

# Verifica LUKS
if ! cryptsetup isLuks "$ROOT_IMG"; then
    echo "✗ ERROR: root.img is not a LUKS volume"
    file "$ROOT_IMG"
    exec /bin/bash
fi

# Unlock
echo ""
echo "Found encrypted root.img"
MAX_ATTEMPTS=3
for attempt in $(seq 1 $MAX_ATTEMPTS);
do
    echo "Enter passphrase to unlock (attempt $attempt of $MAX_ATTEMPTS):"
    if cryptsetup open "$ROOT_IMG" live-root;
    then
        echo ""
        echo "✓ Unlocked successfully!"
        break
    fi
    if [ $attempt -eq $MAX_ATTEMPTS ];
    then
        echo ""
        echo "✗ Failed after $MAX_ATTEMPTS attempts"
        echo "Dropping to shell..."
        exec /bin/bash
    fi
    echo "✗ Wrong passphrase, try again..."
    echo ""
done

# Mount decrypted volume (RO)
# Il messaggio "skipping orphan cleanup" apparirà, ma è innocuo.
echo ""
echo "Mounting decrypted volume (ro)..."
if ! mount -t ext4 -o ro /dev/mapper/live-root /mnt/root-img; then
    echo "✗ ERROR: Failed to mount decrypted volume (ro)"
    cryptsetup close live-root
    exec /bin/bash
fi

# Mount real filesystem
echo "Mounting real filesystem (ro)..."
if ! mount -t squashfs -o ro,loop /mnt/root-img/filesystem.squashfs /mnt/real-root; then
    echo "✗ ERROR: Failed to mount real filesystem"
    umount /mnt/root-img
    cryptsetup close live-root
    exec /bin/bash
fi

# Create overlay in RAM
echo "Creating writable overlay..."
mkdir -p /run/overlay-upper
mkdir -p /run/overlay-work
if ! mount -t overlay overlay \
    -o lowerdir=/mnt/real-root,upperdir=/run/overlay-upper,workdir=/run/overlay-work \
    /newroot;
then
    echo "✗ ERROR: Failed to mount overlay"
    umount /mnt/real-root
    umount /mnt/root-img
    cryptsetup close live-root
    exec /bin/bash
fi
echo "✓ Overlay mounted successfully on /newroot"

# =================================================================
#  BLOCCO CHROOT
# =================================================================
echo ""
echo "Preparing for chroot..."

# Crea i punti di montaggio per i filesystem speciali
mkdir -p /newroot/dev
mkdir -p /newroot/proc
mkdir -p /newroot/sys
mkdir -p /newroot/run

# Bind-mount dei filesystem speciali (FONDAMENTALE)
echo "Binding kernel filesystems..."
mount --bind /dev /newroot/dev
mount --bind /dev/pts /newroot/dev/pts
mount --bind /proc /newroot/proc
mount --bind /sys /newroot/sys
mount --bind /run /newroot/run

echo "✓ Bind mounts completed."
echo ""
echo "=========================================================="
echo "  ENTERING CHROOT"
echo "  Sei ora DENTRO il sistema sbloccato."
echo "  Esegui 'exit' per uscire e tornare alla shell live."
echo "----------------------------------------------------------"
echo "  Per avviare i servizi (XFCE), prova a eseguire:"
echo "  # systemctl start lightdm.service"
echo "  (o gdm.service, sddm.service, etc.)"
echo "=========================================================="
echo ""
sleep 2

# Entra nel chroot con una shell di root completa
chroot /newroot /bin/su - root

# --- ESECUZIONE SOSPESA FINO A 'exit' ---

# DOPO L'USCITA DALLO CHROOT
echo ""
echo "=========================================================="
echo "  EXITED CHROOT"
echo "  Pulizia dei mount..."
echo "=========================================================="

# Esegui la pulizia finale
umount -R /newroot/dev     2>/dev/null || true
umount -R /newroot/proc    2>/dev/null || true
umount -R /newroot/sys     2>/dev/null || true
umount -R /newroot/run     2>/dev/null || true
umount /newroot            2>/dev/null || true
umount /mnt/real-root      2>/dev/null || true
umount /mnt/root-img       2>/dev/null || true
cryptsetup close live-root 2>/dev/null || true

echo "✓ Cleanup completo. Ritorno alla shell live."