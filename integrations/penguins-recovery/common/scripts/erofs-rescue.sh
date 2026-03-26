#!/bin/bash
# common/scripts/erofs-rescue.sh
#
# EROFS filesystem rescue and inspection tools for penguins-recovery.
#
# EROFS (https://github.com/erofs/erofs-utils) is a read-only compressed
# filesystem used in Android system images, ChromeOS, and embedded Linux.
# It is upstream in the Linux kernel since 5.4.
#
# This script provides recovery operations for systems using EROFS:
#   - Filesystem check (fsck.erofs)
#   - Image inspection (dump.erofs)
#   - Content extraction (fsck.erofs --extract)
#   - Kernel support detection
#   - Mounting EROFS images for inspection
#
# Usage:
#   ./erofs-rescue.sh [command] [image-or-device] [options]
#
# Commands:
#   check   <image>              Run fsck.erofs integrity check
#   dump    <image>              Show EROFS superblock metadata
#   extract <image> <output-dir> Extract image contents to directory
#   mount   <image> <mountpoint> Mount EROFS image (read-only)
#   umount  <mountpoint>         Unmount EROFS image
#   kernel-check                 Check if running kernel supports EROFS
#   install-tools                Install erofs-utils via package manager
#   help                         Show this help

set -euo pipefail

RED='\033[1;31m'
GRN='\033[1;32m'
YEL='\033[1;33m'
BLU='\033[1;34m'
RST='\033[0m'

info()  { echo -e "${GRN}[erofs-rescue]${RST} $*"; }
warn()  { echo -e "${YEL}[erofs-rescue]${RST} $*"; }
error() { echo -e "${RED}[erofs-rescue]${RST} $*" >&2; }
title() { echo -e "${BLU}[erofs-rescue]${RST} $*"; }

COMMAND="${1:-help}"
ARG1="${2:-}"
ARG2="${3:-}"

# ── Tool detection ────────────────────────────────────────────────────────────

check_fsck_erofs() {
  if ! command -v fsck.erofs &>/dev/null; then
    error "fsck.erofs not found."
    error "Run: erofs-rescue.sh install-tools"
    exit 1
  fi
}

check_dump_erofs() {
  if ! command -v dump.erofs &>/dev/null; then
    warn "dump.erofs not found. Some features unavailable."
    return 1
  fi
  return 0
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_check() {
  local image="$1"
  [[ -z "$image" ]] && { error "Usage: erofs-rescue.sh check <image>"; exit 1; }
  [[ ! -f "$image" && ! -b "$image" ]] && { error "Not found: $image"; exit 1; }

  check_fsck_erofs
  info "Running fsck.erofs on: $image"
  if fsck.erofs "$image"; then
    info "✓ EROFS image is intact: $image"
  else
    error "✗ EROFS image has errors: $image"
    exit 1
  fi
}

cmd_dump() {
  local image="$1"
  [[ -z "$image" ]] && { error "Usage: erofs-rescue.sh dump <image>"; exit 1; }
  [[ ! -f "$image" && ! -b "$image" ]] && { error "Not found: $image"; exit 1; }

  if check_dump_erofs; then
    title "EROFS superblock: $image"
    dump.erofs "$image"
  else
    # Fallback: use fsck.erofs -v for basic info
    check_fsck_erofs
    title "EROFS info (fsck.erofs -v): $image"
    fsck.erofs -v "$image" 2>&1 | head -40
  fi
}

cmd_extract() {
  local image="$1"
  local outdir="$2"
  [[ -z "$image" || -z "$outdir" ]] && {
    error "Usage: erofs-rescue.sh extract <image> <output-dir>"
    exit 1
  }
  [[ ! -f "$image" && ! -b "$image" ]] && { error "Not found: $image"; exit 1; }

  check_fsck_erofs
  mkdir -p "$outdir"
  info "Extracting $image → $outdir"
  fsck.erofs --extract="$outdir" "$image"
  info "Extraction complete: $outdir"
}

cmd_mount() {
  local image="$1"
  local mountpoint="$2"
  [[ -z "$image" || -z "$mountpoint" ]] && {
    error "Usage: erofs-rescue.sh mount <image> <mountpoint>"
    exit 1
  }
  [[ ! -f "$image" && ! -b "$image" ]] && { error "Not found: $image"; exit 1; }

  if [[ "$EUID" -ne 0 ]]; then
    error "mount requires root."
    exit 1
  fi

  # Check kernel support
  if ! grep -q erofs /proc/filesystems 2>/dev/null; then
    info "Loading EROFS kernel module..."
    modprobe erofs 2>/dev/null || {
      error "EROFS not supported by running kernel (requires >= 5.4)."
      error "Run: erofs-rescue.sh kernel-check"
      exit 1
    }
  fi

  mkdir -p "$mountpoint"
  mount -t erofs -o ro "$image" "$mountpoint"
  info "Mounted: $image → $mountpoint (read-only)"
}

cmd_umount() {
  local mountpoint="$1"
  [[ -z "$mountpoint" ]] && { error "Usage: erofs-rescue.sh umount <mountpoint>"; exit 1; }

  if [[ "$EUID" -ne 0 ]]; then
    error "umount requires root."
    exit 1
  fi

  umount "$mountpoint"
  info "Unmounted: $mountpoint"
}

cmd_kernel_check() {
  title "EROFS kernel support check"
  echo ""

  # Kernel version
  local kver
  kver=$(uname -r)
  local major minor
  major=$(echo "$kver" | cut -d. -f1)
  minor=$(echo "$kver" | cut -d. -f2)

  echo "  Kernel: $kver"

  if [[ "$major" -gt 5 ]] || [[ "$major" -eq 5 && "$minor" -ge 4 ]]; then
    echo "  Version: ✓ >= 5.4 (EROFS supported)"
  else
    echo "  Version: ✗ < 5.4 (EROFS not available)"
  fi

  # Check /proc/filesystems
  if grep -q erofs /proc/filesystems 2>/dev/null; then
    echo "  /proc/filesystems: ✓ erofs listed (module loaded)"
  else
    # Try modprobe
    if modprobe erofs 2>/dev/null; then
      echo "  modprobe erofs: ✓ module loaded successfully"
    else
      echo "  modprobe erofs: ✗ module not available"
    fi
  fi

  # Check erofs-utils
  echo ""
  for tool in mkfs.erofs fsck.erofs dump.erofs; do
    if command -v "$tool" &>/dev/null; then
      local ver
      ver=$("$tool" --version 2>&1 | head -1 || echo "unknown")
      echo "  $tool: ✓ ($ver)"
    else
      echo "  $tool: ✗ not found"
    fi
  done
}

cmd_install_tools() {
  title "Installing erofs-utils"

  if command -v apt-get &>/dev/null; then
    apt-get install -y erofs-utils
  elif command -v pacman &>/dev/null; then
    pacman -S --noconfirm erofs-utils
  elif command -v dnf &>/dev/null; then
    dnf install -y erofs-utils
  elif command -v zypper &>/dev/null; then
    zypper install -y erofs-utils
  elif command -v apk &>/dev/null; then
    apk add erofs-utils
  else
    error "Unknown package manager. Install erofs-utils manually."
    error "Source: https://github.com/erofs/erofs-utils"
    exit 1
  fi

  info "erofs-utils installed."
}

# ── Dispatch ──────────────────────────────────────────────────────────────────

case "$COMMAND" in
  check)         cmd_check "$ARG1" ;;
  dump)          cmd_dump "$ARG1" ;;
  extract)       cmd_extract "$ARG1" "$ARG2" ;;
  mount)         cmd_mount "$ARG1" "$ARG2" ;;
  umount)        cmd_umount "$ARG1" ;;
  kernel-check)  cmd_kernel_check ;;
  install-tools) cmd_install_tools ;;
  help|--help|-h)
    sed -n '2,/^$/s/^# //p' "$0"
    ;;
  *)
    error "Unknown command: $COMMAND"
    echo "Run: erofs-rescue.sh help"
    exit 1
    ;;
esac
