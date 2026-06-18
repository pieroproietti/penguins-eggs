package planner

import (
	"fmt"
	"strings"

	"coa/pkg/pathDefaults"
	"coa/pkg/parser"
)

// luksInitrdPrepStep sostituisce il passo "initramfs" in modalità crypted.
// Prepara il chroot con boot-encrypted-root.sh, hook per losetup/rsync,
// un crypttab dummy, poi esegue mkinitramfs → /tmp/initrd.img-luks nel liveroot.
func luksInitrdPrepStep(workPath string) OATask {
	liveRoot := fmt.Sprintf("%s/liveroot", workPath)
	cmd := fmt.Sprintf(`#!/bin/bash
set -e
LIVEROOT="%s"
KERNEL="$(uname -r)"
PREMOUNT_DIR="$LIVEROOT/etc/initramfs-tools/scripts/live-premount"
HOOKS_DIR="$LIVEROOT/etc/initramfs-tools/hooks"

echo "LUKS: preparazione initrd LUKS per kernel $KERNEL..."

# 1. Copia boot-encrypted-root.sh nel live-premount del chroot
mkdir -p "$PREMOUNT_DIR"
cp /etc/oa-tools.d/scripts/boot-encrypted-root.sh "$PREMOUNT_DIR/"
chmod +x "$PREMOUNT_DIR/boot-encrypted-root.sh"
echo "LUKS: boot-encrypted-root.sh installato in $PREMOUNT_DIR"

# 2. Scrivi crypttab dummy (sovrascrive quello sanitizzato)
# Questo forza mkinitramfs a includere cryptsetup nell'initrd.
printf "# Dummy entry to ensure cryptsetup is included\ncryptroot UUID=none none luks\n" \
    > "$LIVEROOT/etc/crypttab"
echo "LUKS: crypttab dummy scritto."

# 3. Hook per losetup e rsync (richiesti da boot-encrypted-root.sh nel initrd)
mkdir -p "$HOOKS_DIR"
for CMDPATH in /usr/sbin/losetup /usr/bin/rsync; do
    if [ ! -e "$LIVEROOT/$CMDPATH" ]; then
        echo "LUKS: WARN: $CMDPATH non trovato nel liveroot, salto."
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
copy_exec $CMDPATH $DESTDIR || echo "WARN: copy_exec $CMDPATH fallito" >&2
exit 0
HOOKEOF
    chmod +x "$HOOK_FILE"
    echo "LUKS: hook $HOOK_FILE creato."
done

# 4. Genera initrd con supporto LUKS dentro il chroot
echo "LUKS: generazione initrd in corso (potrebbe richiedere qualche minuto)..."
chroot "$LIVEROOT" /bin/bash -c \
    "mkinitramfs -o /tmp/initrd.img-luks $KERNEL" > /dev/null

echo "LUKS: initrd LUKS generato in $LIVEROOT/tmp/initrd.img-luks"
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
// Copia vmlinuz normalmente e usa l'initrd LUKS generato da luksInitrdPrepStep.
func luksKernelCopyStep(workPath string) OATask {
	liveRoot := fmt.Sprintf("%s/liveroot", workPath)
	isoDir := fmt.Sprintf("%s/isodir/live", workPath)
	cmd := fmt.Sprintf(`#!/bin/bash
set -e
KERNEL="$(uname -r)"
LIVEROOT="%s"
ISODIR="%s"

mkdir -p "$ISODIR"

# Copia vmlinuz dal sistema host
cp "/boot/vmlinuz-$KERNEL" "$ISODIR/vmlinuz"
echo "LUKS: vmlinuz copiato in $ISODIR"

# Sposta l'initrd LUKS (generato da luksInitrdPrepStep) in isodir
if [ ! -f "$LIVEROOT/tmp/initrd.img-luks" ]; then
    echo "LUKS ERROR: initrd LUKS non trovato in $LIVEROOT/tmp/initrd.img-luks"
    exit 1
fi
mv "$LIVEROOT/tmp/initrd.img-luks" "$ISODIR/initrd.img"
echo "LUKS: initrd LUKS spostato in $ISODIR/initrd.img"
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
    echo "LUKS ERROR: filesystem.squashfs non trovato: $SQUASHFS"
    exit 1
fi

# Calcola la dimensione del container LUKS
SQFS_SIZE=$(stat -c%%s "$SQUASHFS")
OVERHEAD=$(( SQFS_SIZE * 4 / 100 ))
LUKS_HDR=$(( 32 * 1024 * 1024 ))
BUFFER=$(( 120 * 1024 * 1024 ))
TOTAL=$(( SQFS_SIZE + OVERHEAD + LUKS_HDR + BUFFER ))
ALIGN=$(( 4 * 1024 * 1024 ))
LUKS_SIZE=$(( (TOTAL + ALIGN - 1) / ALIGN * ALIGN ))

echo "LUKS: filesystem.squashfs: $(( SQFS_SIZE / 1024 / 1024 )) MB"
echo "LUKS: container root.img:  $(( LUKS_SIZE / 1024 / 1024 )) MB"

# Crea e formatta il container LUKS
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

echo "LUKS: sposto filesystem.squashfs dentro il container..."
mkdir -p "$LUKS_MOUNT/live"
mv "$SQUASHFS" "$LUKS_MOUNT/live/filesystem.squashfs"
sync

echo "LUKS: chiusura container..."
umount "$LUKS_MOUNT"
cryptsetup close "$MAPPER"

echo "LUKS: installazione root.img in isodir..."
mv "$LUKS_TMP" "$ROOT_IMG"

echo "LUKS: root.img creato con successo → $ROOT_IMG"
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
