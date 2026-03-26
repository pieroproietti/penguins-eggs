#!/bin/bash
# Build the kernel with the Alpine initramfs embedded, producing LifeboatLinux.efi.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "${SCRIPT_DIR}/build"

ROOTFS="alpine-minirootfs"
CACHEPATH="${ROOTFS}/var/cache/apk/"
SHELLHISTORY="${ROOTFS}/root/.ash_history"
DEVCONSOLE="${ROOTFS}/dev/console"
MODULESPATH="${ROOTFS}/lib/modules/"
DEVURANDOM="${ROOTFS}/dev/urandom"

KERNELVERSION="$(ls -d linux-* 2>/dev/null | head -1 | cut -d- -f2)"
export INSTALL_MOD_PATH="../${ROOTFS}/"

THREADS=$(nproc --ignore=1)
DATE_CMD="date +%H:%M:%S"

echo "----------------------------------------------------"
echo "Checking root filesystem..."

[ -n "$(ls -A "$CACHEPATH" 2>/dev/null)" ] && rm -f "${CACHEPATH}"*
[ -f "$SHELLHISTORY" ] && rm -f "$SHELLHISTORY"

mkdir -p "$MODULESPATH"
[ -n "$(ls -A "$MODULESPATH" 2>/dev/null)" ] && rm -rf "${MODULESPATH}"*

if [ -e "$DEVURANDOM" ]; then
    umount "$DEVURANDOM" 2>/dev/null || true
    rm -f "$DEVURANDOM"
fi

[ -d "$DEVCONSOLE" ] && rm -rf "$DEVCONSOLE"
[ -f "$DEVCONSOLE" ] && rm -f "$DEVCONSOLE"
if [ ! -e "$DEVCONSOLE" ]; then
    echo "Creating console device..."
    fakeroot mknod -m 600 "$DEVCONSOLE" c 5 1
fi

echo "Rootfs size (no modules): $(du -sh "$ROOTFS" | cut -f1)"

cd linux

echo "----------------------------------------------------"
echo "$(eval $DATE_CMD) Building kernel + initramfs ($THREADS threads)..."
nice -19 make -s -j"$THREADS"

echo "----------------------------------------------------"
echo "$(eval $DATE_CMD) Building kernel modules ($THREADS threads)..."
nice -19 make -s modules -j"$THREADS"

echo "$(eval $DATE_CMD) Installing kernel modules into rootfs..."
nice -19 make -s modules_install

echo "$(eval $DATE_CMD) Rootfs size (with modules): $(du -sh "../${ROOTFS}" | cut -f1)"

echo "----------------------------------------------------"
echo "$(eval $DATE_CMD) Generating modules.dep..."
nice -19 depmod -b "../${ROOTFS}" -F System.map "$KERNELVERSION"

echo "----------------------------------------------------"
echo "$(eval $DATE_CMD) Final kernel build (with modules embedded)..."
nice -19 make -s -j"$THREADS"

TARGET="${SCRIPT_DIR}/dist/LifeboatLinux.efi"
mkdir -p "${SCRIPT_DIR}/dist"
cp arch/x86/boot/bzImage "$TARGET"

echo "----------------------------------------------------"
echo "$(eval $DATE_CMD) Built: $TARGET ($(du -sh "$TARGET" | cut -f1))"
