#!/bin/bash
# adapters/fuse-overlay/fuse-overlay-adapter.sh
#
# Rootless ISO adaptation via fuse-overlayfs.
#
# fuse-overlayfs (https://github.com/containers/fuse-overlayfs) implements
# overlay+shiftfs in FUSE, enabling overlayfs semantics without kernel
# privileges. This adapter wraps the standard adapter.sh pipeline so that
# ISO adaptation (unsquash → modify → resquash) can run inside rootless
# containers (Podman, Docker --user, CI runners).
#
# When kernel overlayfs is available (root), this adapter is a thin pass-
# through. When running rootless, it transparently substitutes fuse-overlayfs
# for all overlay mount operations.
#
# Usage:
#   ./fuse-overlay-adapter.sh --input <iso> --output <iso> [options]
#
# Options:
#   --input   <path>   Input ISO (penguins-eggs naked ISO)
#   --output  <path>   Output ISO with recovery tools layered in
#   --work    <dir>    Working directory (default: /tmp/fuse-overlay-work)
#   --uid-map <map>    UID mapping for fuse-overlayfs (host:container:count)
#   --gid-map <map>    GID mapping for fuse-overlayfs
#   --keep-work        Don't clean up working directory
#   --check            Check overlay support and exit
#   --help             Show this help

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECOVERY_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[1;31m'
GRN='\033[1;32m'
YEL='\033[1;33m'
RST='\033[0m'

info()  { echo -e "${GRN}[fuse-overlay]${RST} $*"; }
warn()  { echo -e "${YEL}[fuse-overlay]${RST} $*"; }
error() { echo -e "${RED}[fuse-overlay]${RST} $*" >&2; }

INPUT=""
OUTPUT=""
WORK_DIR="/tmp/fuse-overlay-work"
UID_MAP=""
GID_MAP=""
KEEP_WORK="false"
CHECK_ONLY="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input)    INPUT="$2";    shift 2 ;;
    --output)   OUTPUT="$2";   shift 2 ;;
    --work)     WORK_DIR="$2"; shift 2 ;;
    --uid-map)  UID_MAP="$2";  shift 2 ;;
    --gid-map)  GID_MAP="$2";  shift 2 ;;
    --keep-work) KEEP_WORK="true"; shift ;;
    --check)    CHECK_ONLY="true"; shift ;;
    --help|-h)  sed -n '2,/^$/s/^# //p' "$0"; exit 0 ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Overlay support detection ─────────────────────────────────────────────────

USE_FUSE="false"
FUSE_BIN=""

detect_overlay_support() {
  # Check kernel overlayfs (requires root or user_ns)
  if [[ "$EUID" -eq 0 ]]; then
    local tmp
    tmp=$(mktemp -d)
    mkdir -p "$tmp"/{lower,upper,work,merged}
    if mount -t overlay overlay \
        -o "lowerdir=${tmp}/lower,upperdir=${tmp}/upper,workdir=${tmp}/work" \
        "${tmp}/merged" 2>/dev/null; then
      umount "${tmp}/merged" 2>/dev/null || true
      rm -rf "$tmp"
      info "Overlay: kernel overlayfs available"
      USE_FUSE="false"
      return
    fi
    rm -rf "$tmp"
  fi

  # Fall back to fuse-overlayfs
  if command -v fuse-overlayfs &>/dev/null; then
    FUSE_BIN="fuse-overlayfs"
    USE_FUSE="true"
    info "Overlay: using fuse-overlayfs (rootless mode)"
    return
  fi

  error "No overlay filesystem available."
  error "Options:"
  error "  1. Run as root (kernel overlayfs)"
  error "  2. Install fuse-overlayfs: apt install fuse-overlayfs"
  exit 1
}

check_dev_fuse() {
  if [[ "$USE_FUSE" == "true" ]] && [[ ! -c /dev/fuse ]]; then
    error "/dev/fuse not found. Create it:"
    error "  mknod /dev/fuse -m 0666 c 10 229"
    error "Or install fuse3: apt install fuse3"
    exit 1
  fi
}

if [[ "$CHECK_ONLY" == "true" ]]; then
  detect_overlay_support
  check_dev_fuse
  echo "USE_FUSE=$USE_FUSE"
  echo "FUSE_BIN=$FUSE_BIN"
  exit 0
fi

[[ -z "$INPUT" ]]  && { error "--input required"; exit 1; }
[[ -z "$OUTPUT" ]] && { error "--output required"; exit 1; }
[[ ! -f "$INPUT" ]] && { error "Input ISO not found: $INPUT"; exit 1; }

detect_overlay_support
check_dev_fuse

# ── Cleanup ───────────────────────────────────────────────────────────────────

cleanup() {
  if [[ "$KEEP_WORK" == "false" && -d "$WORK_DIR" ]]; then
    info "Cleaning up: $WORK_DIR"
    # Unmount any lingering overlay mounts
    for mnt in "${WORK_DIR}/merged" "${WORK_DIR}/iso_mnt"; do
      if mountpoint -q "$mnt" 2>/dev/null; then
        if [[ "$USE_FUSE" == "true" ]]; then
          fusermount3 -u "$mnt" 2>/dev/null || fusermount -u "$mnt" 2>/dev/null || umount -l "$mnt" 2>/dev/null || true
        else
          umount -l "$mnt" 2>/dev/null || true
        fi
      fi
    done
    rm -rf "$WORK_DIR"
  fi
}
trap cleanup EXIT

mkdir -p "$WORK_DIR"

# ── Step 1: Extract ISO ───────────────────────────────────────────────────────
info "Step 1/4: Extracting ISO: $INPUT"
ISO_MNT="${WORK_DIR}/iso_mnt"
ISO_EXTRACT="${WORK_DIR}/iso_extract"
mkdir -p "$ISO_MNT" "$ISO_EXTRACT"

if [[ "$EUID" -eq 0 ]]; then
  mount -o loop,ro "$INPUT" "$ISO_MNT"
else
  # Rootless: use fuseiso or 7z
  if command -v fuseiso &>/dev/null; then
    fuseiso "$INPUT" "$ISO_MNT"
  elif command -v 7z &>/dev/null; then
    7z x "$INPUT" -o"$ISO_EXTRACT" -y >/dev/null
    ISO_MNT="$ISO_EXTRACT"
  else
    error "Cannot mount ISO without root. Install fuseiso or p7zip."
    exit 1
  fi
fi

rsync -a "${ISO_MNT}/" "$ISO_EXTRACT/"
if mountpoint -q "$ISO_MNT" 2>/dev/null; then
  if [[ "$EUID" -eq 0 ]]; then
    umount "$ISO_MNT"
  else
    fusermount3 -u "$ISO_MNT" 2>/dev/null || fusermount -u "$ISO_MNT" 2>/dev/null || true
  fi
fi

# ── Step 2: Set up overlay over the squashfs rootfs ───────────────────────────
info "Step 2/4: Setting up overlay over squashfs rootfs"

SQUASHFS="${ISO_EXTRACT}/live/filesystem.squashfs"
[[ ! -f "$SQUASHFS" ]] && SQUASHFS=$(find "$ISO_EXTRACT" -name "*.squashfs" | head -1)
[[ -z "$SQUASHFS" ]] && { error "No squashfs found in ISO"; exit 1; }

SQUASHFS_MNT="${WORK_DIR}/squashfs_mnt"
OVERLAY_UPPER="${WORK_DIR}/overlay_upper"
OVERLAY_WORK="${WORK_DIR}/overlay_work"
OVERLAY_MERGED="${WORK_DIR}/merged"
mkdir -p "$SQUASHFS_MNT" "$OVERLAY_UPPER" "$OVERLAY_WORK" "$OVERLAY_MERGED"

# Mount squashfs
if [[ "$EUID" -eq 0 ]]; then
  mount -o loop,ro "$SQUASHFS" "$SQUASHFS_MNT"
else
  if command -v squashfuse &>/dev/null; then
    squashfuse "$SQUASHFS" "$SQUASHFS_MNT"
  else
    error "Cannot mount squashfs without root. Install squashfuse."
    exit 1
  fi
fi

# Mount overlay
OVERLAY_OPTS="lowerdir=${SQUASHFS_MNT},upperdir=${OVERLAY_UPPER},workdir=${OVERLAY_WORK}"

if [[ "$USE_FUSE" == "true" ]]; then
  FUSE_ARGS="-o ${OVERLAY_OPTS}"
  [[ -n "$UID_MAP" ]] && FUSE_ARGS+=" -o uidmapping=${UID_MAP}"
  [[ -n "$GID_MAP" ]] && FUSE_ARGS+=" -o gidmapping=${GID_MAP}"
  fuse-overlayfs $FUSE_ARGS "$OVERLAY_MERGED"
else
  mount -t overlay overlay -o "$OVERLAY_OPTS" "$OVERLAY_MERGED"
fi

info "Overlay mounted: $OVERLAY_MERGED"

# ── Step 3: Layer recovery tools into the overlay ────────────────────────────
info "Step 3/4: Layering recovery tools"

SCRIPTS_DEST="${OVERLAY_UPPER}/usr/local/bin"
mkdir -p "$SCRIPTS_DEST"

for script in \
  "${RECOVERY_ROOT}/common/scripts/chroot-rescue.sh" \
  "${RECOVERY_ROOT}/common/scripts/btrfs-rescue.sh" \
  "${RECOVERY_ROOT}/common/scripts/erofs-rescue.sh" \
  "${RECOVERY_ROOT}/common/scripts/detect-disks.sh" \
  "${RECOVERY_ROOT}/common/scripts/grub-restore.sh" \
  "${RECOVERY_ROOT}/common/scripts/password-reset.sh" \
  "${RECOVERY_ROOT}/common/scripts/uefi-repair.sh" \
  ; do
  if [[ -f "$script" ]]; then
    cp "$script" "$SCRIPTS_DEST/"
    chmod +x "${SCRIPTS_DEST}/$(basename "$script")"
    info "  + $(basename "$script")"
  fi
done

# Add motd
if [[ -f "${RECOVERY_ROOT}/common/branding/motd.txt" ]]; then
  mkdir -p "${OVERLAY_UPPER}/etc"
  cp "${RECOVERY_ROOT}/common/branding/motd.txt" "${OVERLAY_UPPER}/etc/motd"
fi

# ── Step 4: Repack squashfs and rebuild ISO ───────────────────────────────────
info "Step 4/4: Repacking squashfs and rebuilding ISO"

NEW_SQUASHFS="${WORK_DIR}/filesystem.squashfs"
mksquashfs "$OVERLAY_MERGED" "$NEW_SQUASHFS" \
  -comp zstd -Xcompression-level 9 \
  -noappend -no-progress

# Unmount overlay
if [[ "$USE_FUSE" == "true" ]]; then
  fusermount3 -u "$OVERLAY_MERGED" 2>/dev/null || fusermount -u "$OVERLAY_MERGED" 2>/dev/null || true
else
  umount "$OVERLAY_MERGED"
fi

# Unmount squashfs
if [[ "$EUID" -eq 0 ]]; then
  umount "$SQUASHFS_MNT"
else
  fusermount3 -u "$SQUASHFS_MNT" 2>/dev/null || fusermount -u "$SQUASHFS_MNT" 2>/dev/null || true
fi

# Replace squashfs in ISO extract
cp "$NEW_SQUASHFS" "$SQUASHFS"

# Rebuild ISO
if command -v xorriso &>/dev/null; then
  xorriso -as mkisofs \
    -o "$OUTPUT" \
    -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin 2>/dev/null || true \
    -c isolinux/boot.cat \
    -b isolinux/isolinux.bin \
    -no-emul-boot -boot-load-size 4 -boot-info-table \
    -eltorito-alt-boot \
    -e boot/grub/efi.img \
    -no-emul-boot \
    -isohybrid-gpt-basdat \
    "$ISO_EXTRACT" 2>/dev/null || \
  xorriso -as mkisofs -o "$OUTPUT" "$ISO_EXTRACT"
else
  error "xorriso not found. Install: apt install xorriso"
  exit 1
fi

OUTPUT_SIZE=$(du -h "$OUTPUT" | cut -f1)
info "============================================"
info "fuse-overlay adaptation complete!"
info "  Input:  $INPUT"
info "  Output: $OUTPUT ($OUTPUT_SIZE)"
info "  Mode:   $([ "$USE_FUSE" == "true" ] && echo "fuse-overlayfs (rootless)" || echo "kernel overlayfs")"
info "============================================"
