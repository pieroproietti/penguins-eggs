#!/bin/bash
# luks-root-bootstrap-create.sh
# Crea un filesystem.squashfs Debian completo per bootstrap

set -e

OUTPUT_SQUASHFS="$1"
UNLOCK_SCRIPT="$2"

if [ -z "$OUTPUT_SQUASHFS" ] || [ -z "$UNLOCK_SCRIPT" ]; then
    echo "Usage: $0 <output.squashfs> <unlock-script.sh>"
    exit 1
fi

if [ ! -f "$UNLOCK_SCRIPT" ]; then
    echo "Error: Unlock script not found: $UNLOCK_SCRIPT"
    exit 1
fi

WORK_DIR="/var/tmp/bootstrap-filesystem-$$"
BUILD_SUCCESS=0  # Flag per tracciare il successo

echo "=========================================="
echo "  Creating Bootstrap Filesystem"
echo "=========================================="
echo ""
echo "Output: $OUTPUT_SQUASHFS"
echo "Work dir: $WORK_DIR"
echo ""

# Cleanup function
cleanup() {
    if [ -d "$WORK_DIR" ]; then
        echo "Cleaning up work directory..."
        umount "$WORK_DIR/proc" 2>/dev/null || true
        umount "$WORK_DIR/sys" 2>/dev/null || true
        umount "$WORK_DIR/dev/pts" 2>/dev/null || true
        umount "$WORK_DIR/dev" 2>/dev/null || true
        
        # Cancella SOLO se il build è stato completato con successo
        if [ $BUILD_SUCCESS -eq 1 ]; then
            rm -rf "$WORK_DIR"
            echo "Work directory cleaned"
        else
            echo "Work directory preserved for debugging: $WORK_DIR"
        fi
    fi
}

trap cleanup EXIT

# Crea directory di lavoro
mkdir -p "$WORK_DIR"

# 1. Debootstrap - crea sistema Debian minimale
echo "Step 1/8: Running debootstrap (this takes 5-10 minutes)..."
debootstrap \
    --variant=minbase \
    --include=systemd,systemd-sysv,cryptsetup,openssh-server,nano,curl,less,iputils-ping,iproute2,ca-certificates \
    trixie \
    "$WORK_DIR" \
    http://deb.debian.org/debian

echo "✓ Debootstrap completed"

# 2. Configura sistema base
echo ""
echo "Step 2/8: Configuring base system..."

# Hostname
echo "bootstrap" > "$WORK_DIR/etc/hostname"

# Hosts
cat > "$WORK_DIR/etc/hosts" <<EOF
127.0.0.1   localhost
127.0.1.1   bootstrap

::1         localhost ip6-localhost ip6-loopback
ff02::1     ip6-allnodes
ff02::2     ip6-allrouters
EOF

# Fstab vuoto
cat > "$WORK_DIR/etc/fstab" <<EOF
# Bootstrap filesystem - no persistent mounts
EOF

# Password root per SSH debug
echo "root:bootstrap" | chroot "$WORK_DIR" chpasswd

echo "✓ Base system configured"

# 3. Configura networking
echo ""
echo "Step 3/8: Configuring networking..."

mkdir -p "$WORK_DIR/etc/systemd/network"

cat > "$WORK_DIR/etc/systemd/network/20-wired.network" <<EOF
[Match]
Name=en* eth*

[Network]
DHCP=yes
DNS=8.8.8.8
DNS=8.8.4.4
EOF

echo "✓ Networking configured"

# 4. Configura SSH
echo ""
echo "Step 4/8: Configuring SSH..."

mkdir -p "$WORK_DIR/etc/ssh/sshd_config.d"

cat > "$WORK_DIR/etc/ssh/sshd_config.d/bootstrap.conf" <<EOF
# Bootstrap SSH config for debugging
PermitRootLogin yes
PasswordAuthentication yes
PrintMotd no
EOF

# MOTD informativo
cat > "$WORK_DIR/etc/motd" <<EOF

╔════════════════════════════════════════╗
║   Bootstrap System - Debug Shell       ║
╚════════════════════════════════════════╝

This is the bootstrap environment for unlocking
the encrypted root filesystem.

The unlock service should run automatically.
If you see this prompt, something may have failed.

Useful commands:
  - systemctl status encrypted-root-unlock.service
  - journalctl -u encrypted-root-unlock.service
  - /usr/local/sbin/unlock-encrypted-root (manual unlock)

EOF

echo "✓ SSH configured"

# 5. Copia script di unlock
echo ""
echo "Step 5/8: Installing unlock script..."

mkdir -p "$WORK_DIR/usr/local/sbin"
cp "$UNLOCK_SCRIPT" "$WORK_DIR/usr/local/sbin/unlock-encrypted-root"
chmod 755 "$WORK_DIR/usr/local/sbin/unlock-encrypted-root"

echo "✓ Unlock script installed"

# 6. Crea servizio systemd
echo ""
echo "Step 6/8: Creating systemd service..."

mkdir -p "$WORK_DIR/etc/systemd/system"

cat > "$WORK_DIR/etc/systemd/system/encrypted-root-unlock.service" <<EOF
[Unit]
Description=Unlock Encrypted Root and Switch
DefaultDependencies=no
After=systemd-remount-fs.service
Before=basic.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/unlock-encrypted-root
StandardInput=tty
StandardOutput=journal+console
StandardError=journal+console
TTYPath=/dev/console
TTYReset=yes
TTYVHangup=yes
TTYVTDisallocate=yes

[Install]
WantedBy=sysinit.target
EOF

# Abilita servizi
echo "Enabling services..."

# Mount per chroot
mount --bind /proc "$WORK_DIR/proc"
mount --bind /sys "$WORK_DIR/sys"
mount --bind /dev "$WORK_DIR/dev"
mount --bind /dev/pts "$WORK_DIR/dev/pts"

# Abilita servizi (con gestione errori)
chroot "$WORK_DIR" systemctl enable systemd-networkd || echo "Warning: Could not enable systemd-networkd"
chroot "$WORK_DIR" systemctl enable systemd-resolved || echo "Warning: Could not enable systemd-resolved (not critical)"
chroot "$WORK_DIR" systemctl enable ssh || chroot "$WORK_DIR" systemctl enable sshd || echo "Warning: Could not enable SSH"
chroot "$WORK_DIR" systemctl enable encrypted-root-unlock.service || {
    echo "ERROR: Could not enable encrypted-root-unlock.service"
    exit 1
}

# Unmount
umount "$WORK_DIR/dev/pts"
umount "$WORK_DIR/dev"
umount "$WORK_DIR/sys"
umount "$WORK_DIR/proc"

echo "✓ Systemd service created and enabled"

# 7. Cleanup per ridurre dimensioni
echo ""
echo "Step 7/8: Cleaning up to reduce size..."

rm -rf "$WORK_DIR/var/cache/apt/archives/"*
rm -rf "$WORK_DIR/var/lib/apt/lists/"*
rm -rf "$WORK_DIR/tmp/"*
rm -rf "$WORK_DIR/var/tmp/"*
rm -rf "$WORK_DIR/usr/share/doc/"*
rm -rf "$WORK_DIR/usr/share/man/"*
rm -rf "$WORK_DIR/usr/share/info/"*
rm -rf "$WORK_DIR/usr/share/locale/"*

echo "✓ Cleanup completed"

# 8. Crea squashfs
echo ""
echo "Step 8/8: Creating squashfs (this takes 2-3 minutes)..."

if [ -f "$OUTPUT_SQUASHFS" ]; then
    rm -f "$OUTPUT_SQUASHFS"
fi

# CRITICAL: Verifica che WORK_DIR esista prima di mksquashfs!
if [ ! -d "$WORK_DIR" ]; then
    echo "ERROR: Work directory disappeared!"
    exit 1
fi

echo "Source directory: $WORK_DIR"
echo "Output file: $OUTPUT_SQUASHFS"
ls -lh "$WORK_DIR" | head -5

mksquashfs "$WORK_DIR" "$OUTPUT_SQUASHFS" \
    -comp zstd \
    -b 1M \
    -noappend \
    -no-progress

# Verifica che il file sia stato creato
if [ ! -f "$OUTPUT_SQUASHFS" ]; then
    echo ""
    echo "ERROR: Failed to create squashfs file"
    exit 1
fi

SIZE_MB=$(du -m "$OUTPUT_SQUASHFS" | cut -f1)

# Verifica dimensione minima
if [ $SIZE_MB -lt 30 ]; then
    echo ""
    echo "ERROR: Squashfs file is too small ($SIZE_MB MB)"
    echo "Something went wrong during creation"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ Bootstrap filesystem created!"
echo "=========================================="
echo ""
echo "  File: $OUTPUT_SQUASHFS"
echo "  Size: ${SIZE_MB} MB"
echo ""
echo "Features:"
echo "  - Full Debian system with systemd"
echo "  - SSH server (root:bootstrap)"
echo "  - Automatic encrypted root unlock"
echo "  - All debugging tools included"
echo ""

# Marca come successo PRIMA del cleanup
BUILD_SUCCESS=1