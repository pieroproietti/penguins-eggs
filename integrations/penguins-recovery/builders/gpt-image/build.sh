#!/bin/bash
# builders/gpt-image/build.sh
#
# Wrap a penguins-recovery EFI binary into a bootable GPT disk image.
#
# Uses UEFI-GPT-image-creator (https://github.com/queso-fuego/UEFI-GPT-image-creator)
# to produce a raw GPT disk image (.hdd) or VHD with:
#   Partition 1: FAT32 EFI System Partition (ESP) — contains the recovery EFI
#   Partition 2: Basic Data Partition — contains the SquashFS/EROFS rootfs
#
# The output can be:
#   - Written directly to a USB drive: dd if=recovery.hdd of=/dev/sdX
#   - Used as a VM disk image (VHD for VirtualBox/Hyper-V, raw for QEMU)
#   - Booted via UEFI firmware directly
#
# Pairs with builders/verity-uki/ for a verified, signed recovery image.
#
# Usage:
#   ./build.sh [options]
#
# Options:
#   --efi     <path>   EFI binary (default: auto-detect from builders/verity-uki or uki-lite)
#   --rootfs  <path>   SquashFS/EROFS rootfs image (optional data partition)
#   --output  <path>   Output image path (default: recovery.hdd)
#   --esp-size <MiB>   ESP size in MiB (default: 100)
#   --vhd              Produce VHD output (for VirtualBox/Hyper-V)
#   --src-dir <path>   Path to UEFI-GPT-image-creator source (to build write_gpt)
#   --help             Show this help

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECOVERY_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

EFI_BINARY=""
ROOTFS_PATH=""
OUTPUT="recovery.hdd"
ESP_SIZE=100
VHD="false"
SRC_DIR=""

RED='\033[1;31m'; GRN='\033[1;32m'; YEL='\033[1;33m'; RST='\033[0m'
info()  { echo -e "${GRN}[gpt-image]${RST} $*"; }
warn()  { echo -e "${YEL}[gpt-image]${RST} $*"; }
error() { echo -e "${RED}[gpt-image]${RST} $*" >&2; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --efi)      EFI_BINARY="$2"; shift 2 ;;
    --rootfs)   ROOTFS_PATH="$2"; shift 2 ;;
    --output)   OUTPUT="$2"; shift 2 ;;
    --esp-size) ESP_SIZE="$2"; shift 2 ;;
    --vhd)      VHD="true"; shift ;;
    --src-dir)  SRC_DIR="$2"; shift 2 ;;
    --help|-h)  sed -n '2,/^$/s/^# //p' "$0"; exit 0 ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Locate write_gpt ──────────────────────────────────────────────────────────

WRITE_GPT=""

find_write_gpt() {
  if command -v write_gpt &>/dev/null; then
    WRITE_GPT="write_gpt"; return
  fi
  if [[ -n "$SRC_DIR" && -f "${SRC_DIR}/write_gpt" ]]; then
    WRITE_GPT="${SRC_DIR}/write_gpt"; return
  fi
  if [[ -n "$SRC_DIR" && -f "${SRC_DIR}/Makefile" ]]; then
    info "Building write_gpt from source: $SRC_DIR"
    make -C "$SRC_DIR"
    WRITE_GPT="${SRC_DIR}/write_gpt"; return
  fi
  error "write_gpt not found."
  error "Options:"
  error "  1. Build from source:"
  error "     git clone https://github.com/queso-fuego/UEFI-GPT-image-creator"
  error "     make -C UEFI-GPT-image-creator"
  error "     ./build.sh --src-dir UEFI-GPT-image-creator"
  error "  2. Place write_gpt on PATH"
  exit 1
}

find_write_gpt

# ── Auto-detect EFI binary ────────────────────────────────────────────────────

if [[ -z "$EFI_BINARY" ]]; then
  for candidate in \
    "${RECOVERY_ROOT}/builders/verity-uki/recovery-verified.efi" \
    "${RECOVERY_ROOT}/builders/uki-lite/rescue.efi" \
    "${RECOVERY_ROOT}/builders/uki/mkosi.output/image.efi" \
    ; do
    if [[ -f "$candidate" ]]; then
      EFI_BINARY="$candidate"
      info "Auto-detected EFI: $EFI_BINARY"
      break
    fi
  done
fi

[[ -z "$EFI_BINARY" ]] && { error "No EFI binary found. Use --efi or build one first."; exit 1; }
[[ ! -f "$EFI_BINARY" ]] && { error "EFI binary not found: $EFI_BINARY"; exit 1; }

EFI_SIZE=$(du -h "$EFI_BINARY" | cut -f1)
info "EFI binary: $EFI_BINARY ($EFI_SIZE)"

# ── Calculate data partition size ─────────────────────────────────────────────

DATA_SIZE=0
if [[ -n "$ROOTFS_PATH" && -f "$ROOTFS_PATH" ]]; then
  ROOTFS_MIB=$(( $(du -m "$ROOTFS_PATH" | cut -f1) + 50 ))
  DATA_SIZE=$ROOTFS_MIB
  info "Rootfs: $ROOTFS_PATH (data partition: ${DATA_SIZE} MiB)"
fi

# ── Build GPT image ───────────────────────────────────────────────────────────

info "============================================"
info "Building GPT disk image"
info "  Output:  $OUTPUT"
info "  ESP:     ${ESP_SIZE} MiB"
info "  Data:    ${DATA_SIZE} MiB"
info "  VHD:     $VHD"
info "============================================"

WORK_DIR="/tmp/gpt-image-work-$$"
mkdir -p "$WORK_DIR"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

# write_gpt expects BOOTX64.EFI in the current directory
cp "$EFI_BINARY" "${WORK_DIR}/BOOTX64.EFI"

ARGS=("$OUTPUT" "$ESP_SIZE")
[[ "$DATA_SIZE" -gt 0 ]] && ARGS+=("$DATA_SIZE")
[[ "$VHD" == "true" ]] && ARGS+=("--vhd")

cd "$WORK_DIR"
"$WRITE_GPT" "${ARGS[@]}"
cd - >/dev/null

# ── Add rootfs to data partition ──────────────────────────────────────────────

if [[ -n "$ROOTFS_PATH" && -f "$ROOTFS_PATH" && "$DATA_SIZE" -gt 0 ]]; then
  info "Adding rootfs to data partition..."

  if [[ "$EUID" -ne 0 ]]; then
    warn "Root required to add rootfs to data partition. Skipping."
    warn "Run as root or add rootfs manually after writing to disk."
  else
    LOOP_DEV=$(losetup -f --show -P "$OUTPUT")
    MNT="${WORK_DIR}/data_mnt"
    mkdir -p "$MNT"

    # Format and mount data partition
    mkfs.ext4 -q "${LOOP_DEV}p2" 2>/dev/null || true
    mount "${LOOP_DEV}p2" "$MNT"

    mkdir -p "${MNT}/live"
    cp "$ROOTFS_PATH" "${MNT}/live/"
    info "  Copied: $(basename "$ROOTFS_PATH") → data partition /live/"

    umount "$MNT"
    losetup -d "$LOOP_DEV"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────

OUTPUT_SIZE=$(du -h "$OUTPUT" | cut -f1)
info "============================================"
info "GPT image complete!"
info "  Image:  $OUTPUT ($OUTPUT_SIZE)"
info "  Format: $([ "$VHD" == "true" ] && echo "VHD" || echo "raw GPT")"
info "============================================"
info "Write to USB:"
info "  dd if=$OUTPUT of=/dev/sdX bs=4M status=progress"
info "Boot in QEMU:"
info "  qemu-system-x86_64 -bios /usr/share/ovmf/OVMF.fd -hda $OUTPUT"
