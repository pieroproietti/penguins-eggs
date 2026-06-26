package planner

import (
	"fmt"
	"strings"

	"coa/pkg/parser"
	"coa/pkg/pathDefaults"
)

// luksInitrdPrepStep sostituisce il passo "initramfs" in modalità crypted.
// Prepara il chroot con boot-encrypted-root.sh, hook per losetup/rsync,
// un crypttab dummy, poi esegue mkinitramfs → /tmp/oa-initrd.img-luks nel liveroot.
func luksInitrdPrepStep(workPath string) OATask {
	liveRoot := fmt.Sprintf("%s/liveroot", workPath)
	cmd := fmt.Sprintf(`#!/bin/bash
set -e
LIVEROOT="%s"
KERNEL="$(uname -r)"
PREMOUNT_DIR="$LIVEROOT/etc/initramfs-tools/scripts/live-premount"
HOOKS_DIR="$LIVEROOT/etc/initramfs-tools/hooks"

echo "LUKS: preparing LUKS initrd for kernel $KERNEL..."
mkdir -p "$PREMOUNT_DIR"
cp /etc/penguins-eggs.d/scripts/boot-encrypted-root.sh "$PREMOUNT_DIR/"
chmod +x "$PREMOUNT_DIR/boot-encrypted-root.sh"
echo "LUKS: boot-encrypted-root.sh installed in $PREMOUNT_DIR"
printf "# Dummy entry to ensure cryptsetup is included\ncryptroot UUID=none none luks\n" \
    > "$LIVEROOT/etc/crypttab"
echo "LUKS: dummy crypttab written."
mkdir -p "$HOOKS_DIR"
for CMDPATH in /usr/sbin/losetup /usr/bin/rsync; do
    if [ ! -e "$LIVEROOT/$CMDPATH" ]; then
        echo "LUKS: WARN: $CMDPATH not found in liveroot, skipping."
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
    echo "LUKS: hook $HOOK_FILE created."
done

echo "LUKS: generating initrd (this may take a few minutes)..."
chroot "$LIVEROOT" /bin/bash -c \
    "mkinitramfs -o /tmp/oa-initrd.img-luks $KERNEL" > /dev/null

echo "LUKS: LUKS initrd generated at $LIVEROOT/tmp/oa-initrd.img-luks"
`, liveRoot)

	return OATask{
		Step: parser.Step{
			Module: "shell",
			Name:   "luks-initrd-prep",
			Params: map[string]interface{}{
				"command": cmd,
			},
		},
	}
}

// luksKernelCopyStep sostituisce "copy-kernel-initrd" in modalità crypted.
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

// luksWrapStep inietta il passo LUKS dopo mksquashfs.
// Prende filesystem.squashfs, lo inserisce in un container LUKS ext4,
// e produce isodir/live/root.img al posto di filesystem.squashfs.
// La passphrase viene passata via stdin a cryptsetup (--key-file -)
// per evitare di scriverla su disco.
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

# Cleanup in caso di errore
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

echo "LUKS: mkfs.ext4 su /dev/mapper/$MAPPER..."
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

// shellEscape protegge una stringa dall'interpretazione della shell
// dentro un contesto single-quoted di printf.
func shellEscape(s string) string {
	return strings.ReplaceAll(s, "'", "'\\''")
}

// Per rimuovere eventuali residui di LUKS
// sudo rm /etc/initramfs-tools/scripts/live-premount/ -rf
// sudo update-inintramfs -u
