#!/bin/bash
# common/scripts/btrfs-rescue.sh
#
# Btrfs-aware rescue operations for penguins-recovery.
#
# Extends chroot-rescue.sh with Btrfs subvolume awareness. Many modern
# distros (Fedora, openSUSE, Ubuntu with Btrfs, EndeavourOS, Garuda) use
# Btrfs with subvolume layouts like:
#
#   @        → /
#   @home    → /home
#   @snapshots → /.snapshots
#   @var     → /var
#
# Standard chroot-rescue.sh mounts the raw Btrfs partition, which shows
# the top-level subvolume — not the actual root. This script detects the
# subvolume layout and mounts the correct subvolume.
#
# Also provides:
#   - Snapshot listing and rollback
#   - Btrfs filesystem check (btrfs check)
#   - Scrub status
#   - Send/receive for backup/restore
#
# Usage:
#   sudo ./btrfs-rescue.sh [command] [partition] [options]
#
# Commands:
#   chroot    [partition]           Mount correct subvolume and chroot
#   list-subvols [partition]        List all subvolumes
#   list-snapshots [partition]      List snapshots (snapper/timeshift/eggs)
#   rollback [partition] [snapshot] Roll back to a snapshot
#   check [partition]               Run btrfs check (read-only)
#   scrub-status [partition]        Show last scrub status
#   detect-layout [partition]       Detect subvolume layout (snapper/timeshift/eggs)
#   help                            Show this help

set -euo pipefail

RED='\033[1;31m'
GRN='\033[1;32m'
YEL='\033[1;33m'
BLU='\033[1;34m'
RST='\033[0m'

MNT="/mnt/btrfs-rescue"

info()  { echo -e "${GRN}[btrfs-rescue]${RST} $*"; }
warn()  { echo -e "${YEL}[btrfs-rescue]${RST} $*"; }
error() { echo -e "${RED}[btrfs-rescue]${RST} $*" >&2; }
title() { echo -e "${BLU}[btrfs-rescue]${RST} $*"; }

if [[ "$EUID" -ne 0 ]]; then
  error "Must be run as root."
  exit 1
fi

if ! command -v btrfs &>/dev/null; then
  error "btrfs-progs not installed."
  error "Install: apt install btrfs-progs  OR  pacman -S btrfs-progs"
  exit 1
fi

COMMAND="${1:-help}"
PARTITION="${2:-}"

# ── Helpers ───────────────────────────────────────────────────────────────────

mount_toplevel() {
  local part="$1"
  mkdir -p "$MNT"
  mount -o subvolid=5 "$part" "$MNT"
}

umount_all() {
  for m in /run /sys /proc /dev/pts /dev /boot/efi; do
    umount -l "${MNT}${m}" 2>/dev/null || true
  done
  umount -l "$MNT" 2>/dev/null || true
}

detect_root_subvol() {
  # Try common subvolume names for the root filesystem
  local candidates=("@" "@root" "@rootfs" "root" "@linux")
  for name in "${candidates[@]}"; do
    if btrfs subvolume list "$MNT" 2>/dev/null | grep -q " path ${name}$"; then
      echo "$name"
      return
    fi
  done
  # Fall back to the default subvolume
  local default_id
  default_id=$(btrfs subvolume get-default "$MNT" | awk '{print $9}')
  echo "$default_id"
}

detect_layout() {
  local part="$1"
  mount_toplevel "$part"

  title "Btrfs subvolume layout on $part"
  echo ""
  btrfs subvolume list "$MNT" | awk '{print "  " $0}'
  echo ""

  # Detect layout type
  if btrfs subvolume list "$MNT" | grep -q " path @$"; then
    info "Layout: @ convention (Fedora/openSUSE/EndeavourOS style)"
  elif btrfs subvolume list "$MNT" | grep -q " path @rootfs$"; then
    info "Layout: @rootfs convention"
  elif btrfs subvolume list "$MNT" | grep -q "path .snapshots"; then
    info "Snapshots: snapper-managed snapshots detected"
  fi

  # Show default subvolume
  local default
  default=$(btrfs subvolume get-default "$MNT")
  info "Default subvolume: $default"

  umount_all
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_chroot() {
  local part="$1"
  if [[ -z "$part" ]]; then
    error "Usage: btrfs-rescue.sh chroot <partition>"
    exit 1
  fi

  info "Mounting Btrfs partition: $part"
  mount_toplevel "$part"

  # Detect root subvolume
  local root_subvol
  root_subvol=$(detect_root_subvol)
  info "Root subvolume: $root_subvol"

  # Remount with the correct subvolume
  umount "$MNT"
  mkdir -p "$MNT"
  mount -o "subvol=${root_subvol}" "$part" "$MNT"

  # Mount /home subvolume if it exists
  if btrfs subvolume list "$MNT" 2>/dev/null | grep -qE " path @home$| path home$"; then
    local home_subvol="@home"
    btrfs subvolume list "$MNT" | grep -qE " path home$" && home_subvol="home"
    mkdir -p "${MNT}/home"
    mount -o "subvol=${home_subvol}" "$part" "${MNT}/home"
    info "Mounted /home subvolume: $home_subvol"
  fi

  # Bind mounts
  info "Setting up bind mounts..."
  for m in /dev /dev/pts /proc /sys /run; do
    mount -R "$m" "${MNT}${m}"
  done

  # EFI partition (auto-detect)
  if [[ -d "${MNT}/boot/efi" ]]; then
    local efi_part
    efi_part=$(lsblk -o NAME,PARTTYPE -J 2>/dev/null \
      | python3 -c "
import json,sys
d=json.load(sys.stdin)
for dev in d.get('blockdevices',[]):
  for child in dev.get('children',[]):
    if child.get('parttype','').lower() == 'c12a7328-f81f-11d2-ba4b-00a0c93ec93b':
      print('/dev/' + child['name'])
      break
" 2>/dev/null || echo "")
    if [[ -n "$efi_part" ]]; then
      mount "$efi_part" "${MNT}/boot/efi" 2>/dev/null && info "Mounted EFI: $efi_part" || true
    fi
  fi

  info "Entering chroot. Type 'exit' when done."
  chroot "$MNT" /bin/bash
  info "Exited chroot."
  umount_all
}

cmd_list_subvols() {
  local part="$1"
  [[ -z "$part" ]] && { error "Usage: btrfs-rescue.sh list-subvols <partition>"; exit 1; }

  mount_toplevel "$part"
  title "Subvolumes on $part:"
  btrfs subvolume list -p "$MNT"
  umount_all
}

cmd_list_snapshots() {
  local part="$1"
  [[ -z "$part" ]] && { error "Usage: btrfs-rescue.sh list-snapshots <partition>"; exit 1; }

  mount_toplevel "$part"
  title "Snapshots on $part:"

  # snapper snapshots
  if btrfs subvolume list "$MNT" | grep -q ".snapshots"; then
    info "snapper snapshots:"
    btrfs subvolume list "$MNT" | grep ".snapshots" | awk '{print "  " $NF}'
  fi

  # timeshift snapshots
  if btrfs subvolume list "$MNT" | grep -q "timeshift-btrfs"; then
    info "timeshift snapshots:"
    btrfs subvolume list "$MNT" | grep "timeshift-btrfs" | awk '{print "  " $NF}'
  fi

  # eggs snapshots
  if btrfs subvolume list "$MNT" | grep -q "eggs-snapshots"; then
    info "eggs snapshots:"
    btrfs subvolume list "$MNT" | grep "eggs-snapshots" | awk '{print "  " $NF}'
  fi

  umount_all
}

cmd_rollback() {
  local part="$1"
  local snapshot="${3:-}"
  [[ -z "$part" || -z "$snapshot" ]] && {
    error "Usage: btrfs-rescue.sh rollback <partition> <snapshot-path>"
    error "Example: btrfs-rescue.sh rollback /dev/sda3 @/.snapshots/5/snapshot"
    exit 1
  }

  mount_toplevel "$part"

  local snapshot_path="${MNT}/${snapshot}"
  if [[ ! -d "$snapshot_path" ]]; then
    error "Snapshot not found: $snapshot_path"
    umount_all
    exit 1
  fi

  local root_subvol
  root_subvol=$(detect_root_subvol)
  local current_path="${MNT}/${root_subvol}"
  local backup_path="${MNT}/${root_subvol}.old-$(date +%Y%m%d-%H%M%S)"

  warn "This will replace the root subvolume with the snapshot."
  warn "Current root: $current_path → backup: $backup_path"
  warn "Snapshot:     $snapshot_path → new root: $current_path"
  echo ""
  read -rp "Continue? [y/N] " confirm
  [[ "$confirm" != "y" && "$confirm" != "Y" ]] && { info "Aborted."; umount_all; exit 0; }

  # Move current root to backup
  btrfs subvolume snapshot "$current_path" "$backup_path"
  info "Backup created: $backup_path"

  # Create writable snapshot from the read-only snapshot
  btrfs subvolume snapshot "$snapshot_path" "${current_path}-new"

  # Swap: delete old root, rename new
  btrfs subvolume delete "$current_path"
  mv "${current_path}-new" "$current_path"

  info "Rollback complete. Reboot to boot into the restored snapshot."
  umount_all
}

cmd_check() {
  local part="$1"
  [[ -z "$part" ]] && { error "Usage: btrfs-rescue.sh check <partition>"; exit 1; }

  warn "Running btrfs check (read-only). This may take a while on large filesystems."
  btrfs check --readonly "$part"
}

cmd_scrub_status() {
  local part="$1"
  [[ -z "$part" ]] && { error "Usage: btrfs-rescue.sh scrub-status <partition>"; exit 1; }

  mount_toplevel "$part"
  btrfs scrub status "$MNT"
  umount_all
}

# ── Dispatch ──────────────────────────────────────────────────────────────────

case "$COMMAND" in
  chroot)         cmd_chroot "$PARTITION" ;;
  list-subvols)   cmd_list_subvols "$PARTITION" ;;
  list-snapshots) cmd_list_snapshots "$PARTITION" ;;
  rollback)       cmd_rollback "$PARTITION" "${3:-}" ;;
  check)          cmd_check "$PARTITION" ;;
  scrub-status)   cmd_scrub_status "$PARTITION" ;;
  detect-layout)  detect_layout "$PARTITION" ;;
  help|--help|-h)
    sed -n '2,/^$/s/^# //p' "$0"
    ;;
  *)
    error "Unknown command: $COMMAND"
    echo "Run: btrfs-rescue.sh help"
    exit 1
    ;;
esac
