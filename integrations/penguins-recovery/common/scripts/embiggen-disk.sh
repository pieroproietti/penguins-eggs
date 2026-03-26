#!/bin/bash
# common/scripts/embiggen-disk.sh
#
# Live partition and filesystem resize via embiggen-disk.
#
# embiggen-disk (https://github.com/bradfitz/embiggen-disk) resizes a
# filesystem live (no reboot) by first resizing any layers below it:
#   GPT/MBR partition table → optional LVM PV/LV → ext4 or Btrfs filesystem
#
# Useful for:
#   - Expanding a root partition after cloning to a larger disk
#   - Recovering from a failed resize operation
#   - First-boot expansion after installing an eggs-produced ISO
#
# Usage:
#   sudo ./embiggen-disk.sh [device]
#   sudo ./embiggen-disk.sh /dev/sda1
#   sudo ./embiggen-disk.sh /          # expand the live root filesystem
#
# Options:
#   --check    Show available space without resizing
#   --install  Download and install embiggen-disk binary
#   --help     Show this help

set -euo pipefail

RED='\033[1;31m'; GRN='\033[1;32m'; YEL='\033[1;33m'; BLU='\033[1;34m'; RST='\033[0m'
info()  { echo -e "${GRN}[embiggen]${RST} $*"; }
warn()  { echo -e "${YEL}[embiggen]${RST} $*"; }
error() { echo -e "${RED}[embiggen]${RST} $*" >&2; }
title() { echo -e "${BLU}[embiggen]${RST} $*"; }

DEVICE="${1:-}"
CHECK_ONLY="false"
INSTALL_ONLY="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)   CHECK_ONLY="true"; shift ;;
    --install) INSTALL_ONLY="true"; shift ;;
    --help|-h) sed -n '2,/^$/s/^# //p' "$0"; exit 0 ;;
    -*) error "Unknown option: $1"; exit 1 ;;
    *)  DEVICE="$1"; shift ;;
  esac
done

CACHE_DIR="/var/cache/penguins-recovery/embiggen-disk"
BIN_PATH=""

# ── Locate or install embiggen-disk ──────────────────────────────────────────

find_or_install() {
  # Check PATH
  if command -v embiggen-disk &>/dev/null; then
    BIN_PATH="embiggen-disk"
    return
  fi

  # Check cache
  if [[ -x "${CACHE_DIR}/embiggen-disk" ]]; then
    BIN_PATH="${CACHE_DIR}/embiggen-disk"
    return
  fi

  # Try package manager
  if command -v apt-get &>/dev/null; then
    warn "embiggen-disk not found. Attempting to build from source..."
    install_from_source
    return
  fi

  # Download pre-built binary
  download_binary
}

download_binary() {
  local arch
  case "$(uname -m)" in
    x86_64)  arch="linux-amd64" ;;
    aarch64) arch="linux-arm64" ;;
    *)       error "No pre-built binary for $(uname -m). Build from source."; exit 1 ;;
  esac

  mkdir -p "$CACHE_DIR"
  local url="https://github.com/bradfitz/embiggen-disk/releases/latest/download/embiggen-disk_${arch}"
  info "Downloading embiggen-disk from GitHub..."
  curl -fsSL "$url" -o "${CACHE_DIR}/embiggen-disk"
  chmod +x "${CACHE_DIR}/embiggen-disk"
  BIN_PATH="${CACHE_DIR}/embiggen-disk"
  info "embiggen-disk installed to ${CACHE_DIR}/embiggen-disk"
}

install_from_source() {
  if ! command -v go &>/dev/null; then
    error "Go not found. Install Go first: apt install golang"
    error "Or download a pre-built binary: embiggen-disk.sh --install"
    exit 1
  fi
  mkdir -p "$CACHE_DIR"
  GOPATH="$CACHE_DIR" go install github.com/bradfitz/embiggen-disk@latest
  BIN_PATH="${CACHE_DIR}/bin/embiggen-disk"
  info "embiggen-disk built from source: $BIN_PATH"
}

if [[ "$INSTALL_ONLY" == "true" ]]; then
  download_binary
  info "embiggen-disk ready: $BIN_PATH"
  exit 0
fi

find_or_install

# ── Check mode ────────────────────────────────────────────────────────────────

if [[ "$CHECK_ONLY" == "true" ]]; then
  title "Disk space check"
  echo ""

  # Show all block devices with free space
  lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT,LABEL 2>/dev/null || true
  echo ""

  # Show unallocated space on each disk
  for disk in $(lsblk -d -o NAME | tail -n +2); do
    local_free=$(parted -s "/dev/${disk}" unit MiB print free 2>/dev/null \
      | grep "Free Space" | awk '{sum += $3} END {print sum+0}')
    if [[ "${local_free%.*}" -gt 0 ]]; then
      info "/dev/${disk}: ${local_free} MiB unallocated"
    fi
  done
  exit 0
fi

# ── Resize ────────────────────────────────────────────────────────────────────

if [[ -z "$DEVICE" ]]; then
  error "Device required. Usage: embiggen-disk.sh <device>"
  error "Examples:"
  error "  embiggen-disk.sh /dev/sda1   # expand partition + filesystem"
  error "  embiggen-disk.sh /           # expand live root filesystem"
  error "  embiggen-disk.sh --check     # show available space"
  exit 1
fi

if [[ "$EUID" -ne 0 ]]; then
  error "Must be run as root."
  exit 1
fi

# Resolve / to the actual device
if [[ "$DEVICE" == "/" ]]; then
  DEVICE=$(findmnt -n -o SOURCE /)
  info "Root filesystem device: $DEVICE"
fi

[[ ! -b "$DEVICE" && "$DEVICE" != "/" ]] && { error "Not a block device: $DEVICE"; exit 1; }

# Show before state
title "Before resize:"
df -h "$DEVICE" 2>/dev/null || true
echo ""

info "Resizing $DEVICE to fill available space..."
"$BIN_PATH" "$DEVICE"

# Show after state
echo ""
title "After resize:"
df -h "$DEVICE" 2>/dev/null || true

info "Done. $DEVICE has been expanded."
