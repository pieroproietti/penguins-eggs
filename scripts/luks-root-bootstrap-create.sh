#!/bin/bash
# luks-root-bootstrap-create.sh
# Crea un filesystem.squashfs Debian completo per bootstrap
set -e

OUTPUT_SQUASHFS="$1"
UNLOCK_SCRIPT="$2"

# Usa /root per avere sicuramente spazio
WORK_DIR="/root/bootstrap-filesystem-$$"

if [ -z "$OUTPUT_SQUASHFS" ] || [ -z "$UNLOCK_SCRIPT" ]; then
    echo "Usage: $0 <output.squashfs> <unlock-script.sh>"
    exit 1
fi

if [ ! -f "$UNLOCK_SCRIPT" ]; then
    echo "Error: Unlock script not found: $UNLOCK_SCRIPT"
    exit 1
fi

BUILD_SUCCESS=0


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

# 1. Debootstrap - CON kmod e bash-completion
echo "Step 1/6: Running debootstrap (this takes 5-10 minutes)..."
debootstrap \
    --variant=minbase \
    --include=systemd,systemd-sysv,cryptsetup,kmod,bash-completion,nano,less,vim-tiny \
    trixie \
    "$WORK_DIR" \
    http://deb.debian.org/debian

echo "✓ Debootstrap completed"

# 1.5. Copia moduli kernel
echo ""
echo "Step 1.5/6: Copying kernel modules..."

KERNEL_VERSION=$(uname -r)

if [ -d "/lib/modules/$KERNEL_VERSION" ]; then
    echo "Copying kernel modules for $KERNEL_VERSION..."
    
    # Assicurati che la directory esista
    mkdir -p "$WORK_DIR/lib/modules"
    
    # Copia TUTTO il kernel
    cp -a "/lib/modules/$KERNEL_VERSION" "$WORK_DIR/lib/modules/"
    
    # Verifica che sia stato copiato
    if [ -d "$WORK_DIR/lib/modules/$KERNEL_VERSION" ]; then
        echo "✓ Kernel modules copied for $KERNEL_VERSION"
        echo "  Module directory size: $(du -sh "$WORK_DIR/lib/modules/$KERNEL_VERSION" | cut -f1)"
    else
        echo "ERROR: Failed to copy kernel modules!"
        exit 1
    fi
else
    echo "ERROR: Kernel modules not found at /lib/modules/$KERNEL_VERSION"
    exit 1
fi

# 2. Configura sistema base
echo ""
echo "Step 2/6: Configuring base system..."

echo "bootstrap" > "$WORK_DIR/etc/hostname"

cat > "$WORK_DIR/etc/hosts" <<EOF
127.0.0.1   localhost
127.0.1.1   bootstrap

::1         localhost ip6-localhost ip6-loopback
ff02::1     ip6-allnodes
ff02::2     ip6-allrouters
EOF

cat > "$WORK_DIR/etc/fstab" <<EOF
# Bootstrap filesystem - no persistent mounts
EOF

echo "root:evolution" | chroot "$WORK_DIR" chpasswd

# Abilita bash-completion per root
cat >> "$WORK_DIR/root/.bashrc" <<'EOF'

# Enable bash completion
if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
fi

# Useful aliases
alias ll='ls -lah'
alias l='ls -lh'
EOF

cat > "$WORK_DIR/etc/motd" <<EOF

╔════════════════════════════════════════╗
║   Bootstrap System - Debug Shell       ║
╚════════════════════════════════════════╝

This is the bootstrap environment for unlocking
the encrypted root filesystem.

Root credentials:
  Username: root
  Password: evolution

Manual unlock command:
  unlock-encrypted-root

EOF

echo "✓ Base system configured (root password: evolution)"

# 3. Copia script di unlock
echo ""
echo "Step 3/6: Installing unlock script..."
mkdir -p "$WORK_DIR/usr/local/bin"
cp "$UNLOCK_SCRIPT" "$WORK_DIR/usr/local/bin/unlock-encrypted-root"
chmod 755 "$WORK_DIR/usr/local/bin/unlock-encrypted-root"
echo "✓ Unlock script installed at /usr/local/bin/unlock-encrypted-root"

# 4. Fix console getty per stabilità
echo ""
echo "Step 4/6: Configuring stable console..."

mkdir -p "$WORK_DIR/etc/systemd/system/getty@tty1.service.d"
cat > "$WORK_DIR/etc/systemd/system/getty@tty1.service.d/noclear.conf" <<EOF
[Service]
# Mantieni la console pulita e stabile
TTYVTDisallocate=no
EOF

echo "✓ Console configuration applied"

# 5. Cleanup per ridurre dimensioni (ma NON i moduli kernel!)
echo ""
echo "Step 5/6: Cleaning up to reduce size..."
rm -rf "$WORK_DIR/var/cache/apt/archives/"*
rm -rf "$WORK_DIR/var/lib/apt/lists/"*
rm -rf "$WORK_DIR/tmp/"*
rm -rf "$WORK_DIR/var/tmp/"*
rm -rf "$WORK_DIR/usr/share/doc/"*
rm -rf "$WORK_DIR/usr/share/man/"*
rm -rf "$WORK_DIR/usr/share/info/"*

# NON cancellare tutte le locale, lascia en_US per bash-completion
rm -rf "$WORK_DIR/usr/share/locale/"[!e]*
rm -rf "$WORK_DIR/usr/share/locale/en_"[!U]*

echo "✓ Cleanup completed"

# 6. Crea squashfs
echo ""
echo "Step 6/6: Creating squashfs (this takes 2-3 minutes)..."

if [ ! -d "$WORK_DIR" ]; then
    echo "ERROR: Work directory disappeared!"
    exit 1
fi

if [ -f "$OUTPUT_SQUASHFS" ]; then
    rm -f "$OUTPUT_SQUASHFS"
fi

mksquashfs "$WORK_DIR" "$OUTPUT_SQUASHFS" \
    -comp zstd \
    -b 1M \
    -noappend

if [ ! -f "$OUTPUT_SQUASHFS" ]; then
    echo "ERROR: Failed to create squashfs file"
    exit 1
fi

SIZE_MB=$(du -m "$OUTPUT_SQUASHFS" | cut -f1)

echo ""
echo "=========================================="
echo "✓ Bootstrap filesystem created!"
echo "=========================================="
echo ""
echo "  File: $OUTPUT_SQUASHFS"
echo "  Size: ${SIZE_MB} MB"
echo ""
echo "Features:"
echo "  - Minimal Debian system with systemd"
echo "  - Kernel modules included (dm_mod, dm_crypt)"
echo "  - kmod (modprobe, lsmod, etc.)"
echo "  - bash-completion enabled"
echo "  - Stable console"
echo "  - Manual unlock at /usr/local/bin/unlock-encrypted-root"
echo ""
echo "Usage:"
echo "  1. Boot the system"
echo "  2. Login as root (password: evolution)"
echo "  3. Run: unlock-encrypted-root"
echo ""

BUILD_SUCCESS=1