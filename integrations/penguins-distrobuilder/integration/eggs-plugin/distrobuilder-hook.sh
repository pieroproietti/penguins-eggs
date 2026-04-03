#!/bin/sh
# penguins-eggs plugin hook — penguins-distrobuilder
#
# Called by the eggs produce plugin loader after ISO assembly.
# Builds an Incus or LXC container image from the eggs-produced squashfs.
#
# Hook environment variables set by eggs produce:
#   EGGS_HOOK      — hook point (we only act on 'produce')
#   EGGS_ISO_FILE  — full path to the produced ISO
#   EGGS_ISO_ROOT  — snapshot directory
#   EGGS_WORK      — working directory
#
# Configuration (/etc/penguins-distrobuilder/eggs-hooks.conf):
#   DISTROBUILDER_ENABLED           — set to 1 to activate (default: 0)
#   DISTROBUILDER_TYPE              — incus | lxc | both (default: incus)
#   DISTROBUILDER_OUTPUT            — output directory (default: /var/lib/eggs/distrobuilder)
#   DISTROBUILDER_TEMPLATE          — path to template yaml (default: auto-detected)
#   DISTROBUILDER_EXTRA_OPTS        — extra flags passed to distrobuilder
#   DISTROBUILDER_CLEANUP_SQUASHFS  — remove temp squashfs copy after build (default: 0)

set -e

CONF=/etc/penguins-distrobuilder/eggs-hooks.conf
[ -f "$CONF" ] && . "$CONF"

# Only act on the produce hook
[ "${EGGS_HOOK:-}" = "produce" ] || exit 0

DISTROBUILDER_ENABLED="${DISTROBUILDER_ENABLED:-0}"
[ "$DISTROBUILDER_ENABLED" = "1" ] || exit 0

# ── Dependency check ──────────────────────────────────────────────────────────
if ! command -v distrobuilder >/dev/null 2>&1; then
    echo "[distrobuilder] distrobuilder not found in PATH." >&2
    echo "[distrobuilder] Install: sudo snap install distrobuilder --classic" >&2
    echo "[distrobuilder] Or build from source: make build (in penguins-distrobuilder/)" >&2
    exit 1
fi

if ! command -v unsquashfs >/dev/null 2>&1; then
    echo "[distrobuilder] unsquashfs not found. Install squashfs-tools." >&2
    exit 1
fi

# ── Locate the squashfs ───────────────────────────────────────────────────────
SQUASHFS=""
_SQUASHFS_TEMP=0

for candidate in \
    "${EGGS_ISO_ROOT}/live/filesystem.squashfs" \
    "${EGGS_WORK}/live/filesystem.squashfs" \
    "/var/lib/eggs/live/filesystem.squashfs" \
    "/tmp/eggs/live/filesystem.squashfs"
do
    if [ -f "$candidate" ]; then
        SQUASHFS="$candidate"
        break
    fi
done

# Fall back: extract from the ISO
if [ -z "$SQUASHFS" ] && [ -f "${EGGS_ISO_FILE:-}" ]; then
    MOUNT_TMP=$(mktemp -d)
    echo "[distrobuilder] Mounting ISO to locate squashfs: ${EGGS_ISO_FILE}"
    if mount -o loop,ro "${EGGS_ISO_FILE}" "$MOUNT_TMP" 2>/dev/null; then
        for candidate in \
            "$MOUNT_TMP/live/filesystem.squashfs" \
            "$MOUNT_TMP/casper/filesystem.squashfs"
        do
            if [ -f "$candidate" ]; then
                SQUASHFS_COPY=$(mktemp --suffix=.squashfs)
                echo "[distrobuilder] Copying squashfs from ISO (this may take a moment)..."
                cp "$candidate" "$SQUASHFS_COPY"
                SQUASHFS="$SQUASHFS_COPY"
                _SQUASHFS_TEMP=1
                break
            fi
        done
        umount "$MOUNT_TMP" 2>/dev/null || true
    fi
    rmdir "$MOUNT_TMP" 2>/dev/null || true
fi

if [ -z "$SQUASHFS" ]; then
    echo "[distrobuilder] Could not locate filesystem.squashfs." >&2
    echo "[distrobuilder] Set EGGS_ISO_ROOT or EGGS_ISO_FILE, or set EGGS_SQUASHFS directly." >&2
    exit 1
fi

echo "[distrobuilder] Using squashfs: $SQUASHFS"

# ── Detect distro / release / arch from the squashfs ─────────────────────────
_TMP_ROOTFS=$(mktemp -d)
unsquashfs -d "$_TMP_ROOTFS" "$SQUASHFS" etc/os-release etc/debian_version 2>/dev/null || true

if [ -f "$_TMP_ROOTFS/etc/os-release" ]; then
    # shellcheck disable=SC1091
    . "$_TMP_ROOTFS/etc/os-release"
    EGGS_DISTRO="${EGGS_DISTRO:-${ID:-penguins-eggs}}"
    EGGS_RELEASE="${EGGS_RELEASE:-${VERSION_CODENAME:-${VERSION_ID:-rolling}}}"
else
    # shellcheck disable=SC1091
    . /etc/os-release 2>/dev/null || true
    EGGS_DISTRO="${EGGS_DISTRO:-${ID:-penguins-eggs}}"
    EGGS_RELEASE="${EGGS_RELEASE:-${VERSION_CODENAME:-${VERSION_ID:-rolling}}}"
fi
rm -rf "$_TMP_ROOTFS"

EGGS_ARCH="${EGGS_ARCH:-$(uname -m)}"
case "$EGGS_ARCH" in
    x86_64)  EGGS_ARCH=amd64 ;;
    aarch64) EGGS_ARCH=arm64 ;;
    armv7l)  EGGS_ARCH=armhf ;;
esac

echo "[distrobuilder] Detected: distro=${EGGS_DISTRO} release=${EGGS_RELEASE} arch=${EGGS_ARCH}"

# ── Locate template ───────────────────────────────────────────────────────────
if [ -z "${DISTROBUILDER_TEMPLATE:-}" ]; then
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    for candidate in \
        "${SCRIPT_DIR}/../../templates/penguins-eggs.yaml" \
        "/usr/share/penguins-distrobuilder/templates/penguins-eggs.yaml" \
        "/usr/local/share/penguins-distrobuilder/templates/penguins-eggs.yaml"
    do
        if [ -f "$candidate" ]; then
            DISTROBUILDER_TEMPLATE="$(realpath "$candidate")"
            break
        fi
    done
fi

if [ -z "${DISTROBUILDER_TEMPLATE:-}" ] || [ ! -f "$DISTROBUILDER_TEMPLATE" ]; then
    echo "[distrobuilder] Template not found. Set DISTROBUILDER_TEMPLATE in $CONF." >&2
    exit 1
fi

echo "[distrobuilder] Template: $DISTROBUILDER_TEMPLATE"

# ── Build ─────────────────────────────────────────────────────────────────────
DISTROBUILDER_TYPE="${DISTROBUILDER_TYPE:-incus}"
DISTROBUILDER_OUTPUT="${DISTROBUILDER_OUTPUT:-/var/lib/eggs/distrobuilder}"
DISTROBUILDER_EXTRA_OPTS="${DISTROBUILDER_EXTRA_OPTS:-}"

mkdir -p "$DISTROBUILDER_OUTPUT"

export EGGS_SQUASHFS="$SQUASHFS"
export EGGS_DISTRO EGGS_RELEASE EGGS_ARCH

OVERRIDES="-o image.distribution=${EGGS_DISTRO} -o image.release=${EGGS_RELEASE} -o image.architecture=${EGGS_ARCH}"

_build_type() {
    _type="$1"
    echo "[distrobuilder] Building ${_type} image..."
    # shellcheck disable=SC2086
    distrobuilder "build-${_type}" \
        "$DISTROBUILDER_TEMPLATE" \
        "$DISTROBUILDER_OUTPUT" \
        $OVERRIDES \
        $DISTROBUILDER_EXTRA_OPTS
    echo "[distrobuilder] ${_type} image written to: $DISTROBUILDER_OUTPUT"
}

case "$DISTROBUILDER_TYPE" in
    both)  _build_type incus; _build_type lxc ;;
    incus) _build_type incus ;;
    lxc)   _build_type lxc ;;
    *)
        echo "[distrobuilder] Unknown DISTROBUILDER_TYPE='$DISTROBUILDER_TYPE'. Use: incus, lxc, or both." >&2
        exit 1
        ;;
esac

# ── Cleanup ───────────────────────────────────────────────────────────────────
if [ "$_SQUASHFS_TEMP" = "1" ] && [ "${DISTROBUILDER_CLEANUP_SQUASHFS:-0}" = "1" ]; then
    rm -f "$SQUASHFS"
fi

echo "[distrobuilder] Done."
