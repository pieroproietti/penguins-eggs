#!/bin/bash
# builders/mbr-image/build.sh
#
# Build a legacy BIOS-bootable MBR disk image using partymix.
#
# partymix (https://github.com/pyx-cvm/partymix) combines filesystem images
# into a single MBR-partitioned disk image. This builder produces a recovery
# image for legacy BIOS hardware that cannot boot UEFI.
#
# Complements builders/gpt-image/ (UEFI/GPT) for full hardware coverage.
#
# Output layout:
#   Partition 1 (FAT32, active): GRUB bootloader + kernel + initrd
#   Partition 2 (linux):         SquashFS/EROFS recovery rootfs
#
# Usage:
#   ./build.sh [options]
#
# Options:
#   --rootfs  <path>   SquashFS/EROFS rootfs image (required)
#   --output  <path>   Output .img path (default: recovery-mbr.img)
#   --src-dir <path>   Path to partymix source (to build from source)
#   --bin     <path>   Path to partymix binary
#   --help             Show this help

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECOVERY_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ROOTFS_PATH=""
OUTPUT="recovery-mbr.img"
PARTYMIX_SRC=""
PARTYMIX_BIN=""

RED='\033[1;31m'; GRN='\033[1;32m'; YEL='\033[1;33m'; RST='\033[0m'
info()  { echo -e "${GRN}[mbr-image]${RST} $*"; }
warn()  { echo -e "${YEL}[mbr-image]${RST} $*"; }
error() { echo -e "${RED}[mbr-image]${RST} $*" >&2; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --rootfs)   ROOTFS_PATH="$2"; shift 2 ;;
    --output)   OUTPUT="$2";      shift 2 ;;
    --src-dir)  PARTYMIX_SRC="$2"; shift 2 ;;
    --bin)      PARTYMIX_BIN="$2"; shift 2 ;;
    --help|-h)  sed -n '2,/^$/s/^# //p' "$0"; exit 0 ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Locate partymix ───────────────────────────────────────────────────────────

find_partymix() {
  [[ -n "$PARTYMIX_BIN" && -x "$PARTYMIX_BIN" ]] && return
  if command -v partymix &>/dev/null; then PARTYMIX_BIN="partymix"; return; fi
  if [[ -n "$PARTYMIX_SRC" && -f "${PARTYMIX_SRC}/target/release/partymix" ]]; then
    PARTYMIX_BIN="${PARTYMIX_SRC}/target/release/partymix"; return
  fi
  if [[ -n "$PARTYMIX_SRC" && -f "${PARTYMIX_SRC}/Cargo.toml" ]]; then
    info "Building partymix from source: $PARTYMIX_SRC"
    cargo build --release --manifest-path "${PARTYMIX_SRC}/Cargo.toml"
    PARTYMIX_BIN="${PARTYMIX_SRC}/target/release/partymix"; return
  fi
  error "partymix not found."
  error "Options:"
  error "  1. Build from source:"
  error "     git clone https://github.com/pyx-cvm/partymix"
  error "     cargo build --release --manifest-path partymix/Cargo.toml"
  error "     ./build.sh --src-dir partymix"
  error "  2. Place partymix on PATH"
  exit 1
}

find_partymix

# ── Validate inputs ───────────────────────────────────────────────────────────

if [[ -z "$ROOTFS_PATH" ]]; then
  # Auto-detect from other builders
  for candidate in \
    "${RECOVERY_ROOT}/builders/debian/recovery.squashfs" \
    "${RECOVERY_ROOT}/builders/buildroot/output-recovery/images/rootfs.squashfs" \
    ; do
    if [[ -f "$candidate" ]]; then
      ROOTFS_PATH="$candidate"
      info "Auto-detected rootfs: $ROOTFS_PATH"
      break
    fi
  done
fi

[[ -z "$ROOTFS_PATH" ]] && { error "--rootfs required"; exit 1; }
[[ ! -f "$ROOTFS_PATH" ]] && { error "Rootfs not found: $ROOTFS_PATH"; exit 1; }

ROOTFS_SIZE=$(du -h "$ROOTFS_PATH" | cut -f1)
info "Rootfs: $ROOTFS_PATH ($ROOTFS_SIZE)"

# ── Build FAT32 boot partition image ─────────────────────────────────────────

WORK_DIR="/tmp/mbr-image-work-$$"
mkdir -p "$WORK_DIR"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

info "Building FAT32 boot partition..."

BOOT_IMG="${WORK_DIR}/boot.fat32"
BOOT_MNT="${WORK_DIR}/boot_mnt"
BOOT_SIZE_MB=64

# Create FAT32 image
dd if=/dev/zero of="$BOOT_IMG" bs=1M count="$BOOT_SIZE_MB" status=none
mkfs.fat -F 32 "$BOOT_IMG" >/dev/null

mkdir -p "$BOOT_MNT"

if [[ "$EUID" -eq 0 ]]; then
  mount -o loop "$BOOT_IMG" "$BOOT_MNT"

  # Copy kernel and initrd if available
  KERNEL=$(find /boot -maxdepth 1 -name "vmlinuz*" 2>/dev/null | sort -V | tail -1)
  INITRD=$(find /boot -maxdepth 1 -name "initrd*" -o -name "initramfs*" 2>/dev/null | sort -V | tail -1)

  mkdir -p "${BOOT_MNT}/boot"
  [[ -n "$KERNEL" ]] && cp "$KERNEL" "${BOOT_MNT}/boot/vmlinuz" && info "  kernel: $KERNEL"
  [[ -n "$INITRD" ]] && cp "$INITRD" "${BOOT_MNT}/boot/initrd.img" && info "  initrd: $INITRD"

  # Write syslinux config
  mkdir -p "${BOOT_MNT}/syslinux"
  cat > "${BOOT_MNT}/syslinux/syslinux.cfg" << SYSLINUX_EOF
DEFAULT recovery
TIMEOUT 50
PROMPT 0

LABEL recovery
  MENU LABEL Penguins Recovery
  KERNEL /boot/vmlinuz
  APPEND initrd=/boot/initrd.img quiet splash
SYSLINUX_EOF

  # Install syslinux if available
  if command -v syslinux &>/dev/null; then
    syslinux --install "$BOOT_IMG"
    info "  syslinux installed"
  else
    warn "  syslinux not found — boot partition may not be bootable"
    warn "  Install: apt install syslinux"
  fi

  umount "$BOOT_MNT"
else
  warn "Not running as root — boot partition will be empty"
  warn "Run as root for a fully bootable image"
fi

# ── Assemble MBR disk image ───────────────────────────────────────────────────

info "Assembling MBR disk image..."

"$PARTYMIX_BIN" "$OUTPUT" \
  "fat32:${BOOT_IMG}*" \
  "linux:${ROOTFS_PATH}"

OUTPUT_SIZE=$(du -h "$OUTPUT" | cut -f1)

info "============================================"
info "MBR disk image complete!"
info "  Image:    $OUTPUT ($OUTPUT_SIZE)"
info "  Part 1:   FAT32 boot (${BOOT_SIZE_MB} MiB, active)"
info "  Part 2:   Linux rootfs ($ROOTFS_SIZE)"
info "============================================"
info "Write to USB:"
info "  dd if=$OUTPUT of=/dev/sdX bs=4M status=progress"
info "Boot in QEMU (BIOS):"
info "  qemu-system-x86_64 -hda $OUTPUT"
