package planner

import (
	"fmt"
	"strings"

	"coa/pkg/parser"
	"coa/pkg/pathDefaults"
)

// buildEncryptedInitramfs replaces the standard initramfs step.
// Prepares the chroot (liveroot) for encrypted boot by injecting required scripts
// and generates the initrd, temporarily disarming conflicting host system hooks.
func buildEncryptedInitramfs(workPath string) OATask {
	liveRoot := fmt.Sprintf("%s/liveroot", workPath)
	cmd := fmt.Sprintf(`#!/bin/bash
set -e
LIVEROOT="%s"
KERNEL="$(uname -r)"
PREMOUNT_DIR="$LIVEROOT/etc/initramfs-tools/scripts/live-premount"
HOOKS_DIR="$LIVEROOT/etc/initramfs-tools/hooks"

echo "LUKS: Preparing encrypted initrd for kernel $KERNEL..."

# 1. Inject pre-mount script and create dummy crypttab
mkdir -p "$PREMOUNT_DIR"
cp /etc/penguins-eggs.d/scripts/boot-encrypted-root.sh "$PREMOUNT_DIR/"
chmod +x "$PREMOUNT_DIR/boot-encrypted-root.sh"
printf "# Dummy entry to force inclusion of LUKS binaries\ncryptroot UUID=none none luks\n" > "$LIVEROOT/etc/crypttab"

# 2. Dynamically generate hooks for losetup and rsync
mkdir -p "$HOOKS_DIR"
for CMDPATH in /usr/sbin/losetup /usr/bin/rsync; do
    if [ ! -e "$LIVEROOT/$CMDPATH" ]; then
        echo "LUKS: WARN: $CMDPATH not found on guest system, skipping."
        continue
    fi
    BASENAME=$(basename "$CMDPATH")
    HOOK_FILE="$HOOKS_DIR/add-${BASENAME}-hook.sh"
    DESTDIR="/sbin"
    echo "$CMDPATH" | grep -q '/bin/' && DESTDIR="/bin"
    
    cat > "$HOOK_FILE" << HOOKEOF
#!/bin/sh
PREREQ=""
case \$1 in prereqs) echo "\${PREREQ}"; exit 0;; esac
. /usr/share/initramfs-tools/hook-functions
copy_exec $CMDPATH $DESTDIR || echo "WARN: copy_exec $CMDPATH failed" >&2
exit 0
HOOKEOF
    chmod +x "$HOOK_FILE"
done

# 3. Disarm official Debian cryptroot hook
# Avoids fatal error "Couldn't resolve device overlay" during generation
if [ -f "$LIVEROOT/usr/share/initramfs-tools/hooks/cryptroot" ]; then
    echo "LUKS: Temporarily disabling host cryptroot hook..."
    mv "$LIVEROOT/usr/share/initramfs-tools/hooks/cryptroot" "$LIVEROOT/usr/share/initramfs-tools/hooks/cryptroot.disabled"
fi

# 4. Generate Initramfs (keeping output visible for debugging)
echo "LUKS: Generating initramfs (may take a few minutes)..."
chroot "$LIVEROOT" env CRYPTSETUP=y mkinitramfs -o /tmp/oa-initrd.img-luks "$KERNEL"

# 5. Clean up and restore disabled hook
if [ -f "$LIVEROOT/usr/share/initramfs-tools/hooks/cryptroot.disabled" ]; then
    mv "$LIVEROOT/usr/share/initramfs-tools/hooks/cryptroot.disabled" "$LIVEROOT/usr/share/initramfs-tools/hooks/cryptroot"
fi

echo "✅ LUKS initrd completed successfully: /tmp/oa-initrd.img-luks"
`, liveRoot)

	return OATask{
		Step: parser.Step{
			Module: "shell",
			Name:   "build-encrypted-initramfs",
			Params: map[string]interface{}{
				"command": cmd,
			},
		},
	}
}

// luksKernelCopyStep replaces "copy-kernel-initrd" in crypted mode.
func luksKernelCopyStep(workPath string) OATask {
	liveRoot := fmt.Sprintf("%s/liveroot", workPath)
	isoDir := fmt.Sprintf("%s/isodir/live", workPath)
	cmd := fmt.Sprintf(`#!/bin/bash
set -e
KERNEL="$(uname -r)"
LIVEROOT="%s"
ISODIR="%s"

mkdir -p "$ISODIR"

cp "/boot/vmlinuz-$KERNEL" "$ISODIR/vmlinuz"
echo "LUKS: vmlinuz copied to $ISODIR"

if [ ! -f "$LIVEROOT/tmp/oa-initrd.img-luks" ]; then
    echo "LUKS ERROR: LUKS initrd not found at $LIVEROOT/tmp/initrd.img-luks"
    exit 1
fi
mv "$LIVEROOT/tmp/oa-initrd.img-luks" "$ISODIR/initrd.img"
echo "LUKS: LUKS initrd moved to $ISODIR/initrd.img"
`, liveRoot, isoDir)

	return OATask{
		Step: parser.Step{
			Module: "shell",
			Name:   "luks-kernel-copy",
			Params: map[string]interface{}{
				"command": cmd,
			},
		},
	}
}

// luksWrapStep injects the LUKS step after mksquashfs.
// Takes filesystem.squashfs, places it inside a LUKS ext4 container,
// and produces isodir/live/root.img in place of filesystem.squashfs.
// The passphrase is piped via stdin to cryptsetup (--key-file -)
// to avoid writing it to disk.
func luksWrapStep(workPath, passphrase string) OATask {
	squashfs := fmt.Sprintf("%s/isodir/live/filesystem.squashfs", workPath)
	rootImg := fmt.Sprintf("%s/isodir/live/root.img", workPath)
	cmd := fmt.Sprintf(`#!/bin/bash
set -e

SQUASHFS="%s"
ROOT_IMG="%s"
LUKS_TMP="/var/tmp/root.img"
LUKS_MOUNT="/tmp/mnt/root.img"
MAPPER="luks-root-build"

# Cleanup on error
cleanup() {
    set +e
    mount | grep -q "$LUKS_MOUNT" && umount -lf "$LUKS_MOUNT"
    [ -e "/dev/mapper/$MAPPER" ] && cryptsetup close "$MAPPER"
    [ -f "$LUKS_TMP" ] && rm -f "$LUKS_TMP"
}
trap cleanup ERR

if [ ! -f "$SQUASHFS" ]; then
    echo "LUKS ERROR: filesystem.squashfs not found: $SQUASHFS"
    exit 1
fi

SQFS_SIZE=$(stat -c%%s "$SQUASHFS")
OVERHEAD=$(( SQFS_SIZE * 4 / 100 ))
LUKS_HDR=$(( 32 * 1024 * 1024 ))
BUFFER=$(( 120 * 1024 * 1024 ))
TOTAL=$(( SQFS_SIZE + OVERHEAD + LUKS_HDR + BUFFER ))
ALIGN=$(( 4 * 1024 * 1024 ))
LUKS_SIZE=$(( (TOTAL + ALIGN - 1) / ALIGN * ALIGN ))

echo "LUKS: filesystem.squashfs: $(( SQFS_SIZE / 1024 / 1024 )) MB"
echo "LUKS: container root.img:  $(( LUKS_SIZE / 1024 / 1024 )) MB"

echo "LUKS: truncate $LUKS_TMP..."
truncate --size "$LUKS_SIZE" "$LUKS_TMP"

LUKS_CRYPTO_ARGS=""
if [ -f "%s" ]; then
    LUKS_CRYPTO_ARGS=$(cat "%s")
fi

echo "LUKS: luksFormat..."
printf '%%s' '%s' | cryptsetup luksFormat --batch-mode $LUKS_CRYPTO_ARGS --key-file - "$LUKS_TMP"

echo "LUKS: luksOpen → /dev/mapper/$MAPPER..."
printf '%%s' '%s' | cryptsetup luksOpen --key-file - "$LUKS_TMP" "$MAPPER"

echo "LUKS: mkfs.ext4 on /dev/mapper/$MAPPER..."
mkfs.ext4 -m 0 -O ^has_journal -L live-root /dev/mapper/"$MAPPER"

mkdir -p "$LUKS_MOUNT"
mount /dev/mapper/"$MAPPER" "$LUKS_MOUNT"

echo "LUKS: moving filesystem.squashfs inside the container..."
mkdir -p "$LUKS_MOUNT/live"
mv "$SQUASHFS" "$LUKS_MOUNT/live/filesystem.squashfs"
sync

echo "LUKS: closing container..."
umount "$LUKS_MOUNT"
cryptsetup close "$MAPPER"

echo "LUKS: installing root.img in isodir..."
mv "$LUKS_TMP" "$ROOT_IMG"

echo "LUKS: root.img created successfully → $ROOT_IMG"
`, squashfs, rootImg, pathDefaults.LuksCryptoArgs, pathDefaults.LuksCryptoArgs,
		shellEscape(passphrase), shellEscape(passphrase))

	return OATask{
		Step: parser.Step{
			Module: "shell",
			Name:   "luks-wrap-squashfs",
			Params: map[string]interface{}{
				"command": cmd,
			},
		},
	}
}

// shellEscape protects a string from shell interpretation
// inside a printf single-quoted context.
func shellEscape(s string) string {
	return strings.ReplaceAll(s, "'", "'\\''")
}
