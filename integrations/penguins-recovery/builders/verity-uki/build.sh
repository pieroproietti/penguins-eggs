#!/bin/bash
# builders/verity-uki/build.sh
#
# Build a dm-verity verified, Secure Boot-signed recovery UKI.
#
# This builder extends builders/uki-lite/ with a full chain of trust:
#
#   UEFI firmware → signed UKI → dm-verity Merkle tree → SquashFS recovery rootfs
#
# The recovery rootfs is compressed with SquashFS, a dm-verity hash tree is
# appended, and the root hash is embedded in the UKI's kernel cmdline. The
# UKI is then signed with Secure Boot keys. An attacker who modifies the
# recovery rootfs on disk will cause boot to fail.
#
# Inspired by:
#   - brandsimon/verity-squash-root (dm-verity + SquashFS + UKI)
#   - containerd/go-dmverity (pure Go dm-verity implementation)
#   - builders/uki-lite/build.sh (UKI assembly via objcopy)
#
# Usage:
#   sudo ./build.sh [options]
#
# Options:
#   --rootfs      Recovery rootfs directory (default: auto-build minimal rootfs)
#   --output      Output UKI file (default: recovery-verified.efi)
#   --kernel      Kernel image (default: auto-detect from /boot)
#   --initrd      Initramfs image (default: auto-detect from /boot)
#   --stub        EFI stub (default: auto-detect systemd-stub)
#   --key         Secure Boot signing key (.key file)
#   --cert        Secure Boot signing certificate (.crt file)
#   --no-sign     Skip Secure Boot signing (unsigned UKI)
#   --squashfs    Use existing SquashFS image instead of building from --rootfs
#   --work-dir    Working directory (default: /tmp/verity-uki-work)
#   --keep-work   Don't clean up working directory
#   --help        Show this help

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECOVERY_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Defaults
ROOTFS_DIR=""
OUTPUT="recovery-verified.efi"
KERNEL=""
INITRD=""
STUB=""
KEY_PATH=""
CERT_PATH=""
SIGN="true"
SQUASHFS_INPUT=""
WORK_DIR="/tmp/verity-uki-work"
KEEP_WORK="false"

info()  { echo -e "\033[1;32m[verity-uki]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[verity-uki]\033[0m $*"; }
error() { echo -e "\033[1;31m[verity-uki]\033[0m $*" >&2; }

usage() { sed -n '2,/^$/s/^# //p' "$0"; exit 0; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --rootfs)    ROOTFS_DIR="$2";    shift 2 ;;
    --output)    OUTPUT="$2";        shift 2 ;;
    --kernel)    KERNEL="$2";        shift 2 ;;
    --initrd)    INITRD="$2";        shift 2 ;;
    --stub)      STUB="$2";          shift 2 ;;
    --key)       KEY_PATH="$2";      shift 2 ;;
    --cert)      CERT_PATH="$2";     shift 2 ;;
    --no-sign)   SIGN="false";       shift   ;;
    --squashfs)  SQUASHFS_INPUT="$2"; shift 2 ;;
    --work-dir)  WORK_DIR="$2";      shift 2 ;;
    --keep-work) KEEP_WORK="true";   shift   ;;
    --help|-h)   usage ;;
    *) error "Unknown option: $1"; usage ;;
  esac
done

if [[ "$EUID" -ne 0 ]]; then
  error "Must be run as root (needs mksquashfs, veritysetup, mount)."
  exit 1
fi

# Check required tools
for tool in mksquashfs veritysetup objcopy; do
  if ! command -v "$tool" &>/dev/null; then
    error "Required tool not found: $tool"
    error "Install: apt install squashfs-tools cryptsetup-bin binutils"
    exit 1
  fi
done

if [[ "$SIGN" == "true" ]]; then
  if ! command -v sbsign &>/dev/null; then
    warn "sbsign not found. Secure Boot signing will be skipped."
    warn "Install: apt install sbsigntool"
    SIGN="false"
  fi
  if [[ -z "$KEY_PATH" || -z "$CERT_PATH" ]]; then
    warn "No --key/--cert provided. Secure Boot signing will be skipped."
    SIGN="false"
  fi
fi

# Cleanup handler
cleanup() {
  if [[ "$KEEP_WORK" == "false" && -d "$WORK_DIR" ]]; then
    info "Cleaning up work directory"
    umount -l "${WORK_DIR}/rootfs_mnt" 2>/dev/null || true
    rm -rf "$WORK_DIR"
  fi
}
trap cleanup EXIT

mkdir -p "$WORK_DIR"

info "============================================"
info "Penguins-Recovery: verity-uki builder"
info "============================================"
info "Output:  $OUTPUT"
info "Sign:    $SIGN"
info "Work:    $WORK_DIR"
info "============================================"

# ── Step 1: Prepare SquashFS recovery rootfs ─────────────────────────────────
SQUASHFS_PATH="${WORK_DIR}/recovery.squashfs"

if [[ -n "$SQUASHFS_INPUT" ]]; then
  info "Step 1/5: Using provided SquashFS: $SQUASHFS_INPUT"
  cp "$SQUASHFS_INPUT" "$SQUASHFS_PATH"
elif [[ -n "$ROOTFS_DIR" ]]; then
  info "Step 1/5: Building SquashFS from rootfs: $ROOTFS_DIR"
  mksquashfs "$ROOTFS_DIR" "$SQUASHFS_PATH" \
    -comp zstd -Xcompression-level 9 \
    -noappend -no-progress
else
  info "Step 1/5: Building minimal recovery rootfs"
  ROOTFS_BUILD="${WORK_DIR}/rootfs"
  mkdir -p "$ROOTFS_BUILD"

  # Copy shared recovery scripts into the minimal rootfs
  SCRIPTS_DIR="${ROOTFS_BUILD}/usr/local/bin"
  mkdir -p "$SCRIPTS_DIR"
  for script in chroot-rescue detect-disks grub-restore password-reset uefi-repair; do
    src="${RECOVERY_ROOT}/common/scripts/${script}.sh"
    if [[ -f "$src" ]]; then
      cp "$src" "${SCRIPTS_DIR}/${script}.sh"
      chmod +x "${SCRIPTS_DIR}/${script}.sh"
    fi
  done

  # Copy branding
  if [[ -f "${RECOVERY_ROOT}/common/branding/motd.txt" ]]; then
    mkdir -p "${ROOTFS_BUILD}/etc"
    cp "${RECOVERY_ROOT}/common/branding/motd.txt" "${ROOTFS_BUILD}/etc/motd"
  fi

  mksquashfs "$ROOTFS_BUILD" "$SQUASHFS_PATH" \
    -comp zstd -Xcompression-level 9 \
    -noappend -no-progress
fi

SQUASHFS_SIZE=$(du -h "$SQUASHFS_PATH" | cut -f1)
info "SquashFS: $SQUASHFS_PATH ($SQUASHFS_SIZE)"

# ── Step 2: Generate dm-verity hash tree ─────────────────────────────────────
info "Step 2/5: Generating dm-verity hash tree"
VERITY_PATH="${SQUASHFS_PATH}.verity"

VERITY_OUTPUT=$(veritysetup format "$SQUASHFS_PATH" "$VERITY_PATH" 2>&1)
echo "$VERITY_OUTPUT"

ROOT_HASH=$(echo "$VERITY_OUTPUT" | grep "Root hash:" | awk '{print $3}')
SALT=$(echo "$VERITY_OUTPUT" | grep "Salt:" | awk '{print $2}')

if [[ -z "$ROOT_HASH" ]]; then
  error "Failed to extract root hash from veritysetup output"
  exit 1
fi

info "dm-verity root hash: $ROOT_HASH"
info "dm-verity salt:      $SALT"

# Save root hash for reference
echo "$ROOT_HASH" > "${WORK_DIR}/root-hash.txt"
echo "$SALT"      > "${WORK_DIR}/salt.txt"

# ── Step 3: Auto-detect kernel, initrd, EFI stub ─────────────────────────────
info "Step 3/5: Locating kernel, initrd, EFI stub"

if [[ -z "$KERNEL" ]]; then
  for candidate in \
    /boot/vmlinuz-linux \
    /boot/vmlinuz-"$(uname -r)" \
    /boot/vmlinuz \
    ; do
    if [[ -f "$candidate" ]]; then KERNEL="$candidate"; break; fi
  done
fi
[[ -z "$KERNEL" || ! -f "$KERNEL" ]] && { error "No kernel found. Use --kernel."; exit 1; }

if [[ -z "$INITRD" ]]; then
  for candidate in \
    /boot/initramfs-linux.img \
    /boot/initrd.img-"$(uname -r)" \
    /boot/initramfs-"$(uname -r)".img \
    /boot/initrd.img \
    /boot/initrd \
    ; do
    if [[ -f "$candidate" ]]; then INITRD="$candidate"; break; fi
  done
fi
[[ -z "$INITRD" || ! -f "$INITRD" ]] && { error "No initrd found. Use --initrd."; exit 1; }

if [[ -z "$STUB" ]]; then
  for candidate in \
    /usr/lib/systemd/boot/efi/linuxx64.efi.stub \
    /usr/lib/gummiboot/linuxx64.efi.stub \
    ; do
    if [[ -f "$candidate" ]]; then STUB="$candidate"; break; fi
  done
fi
[[ -z "$STUB" || ! -f "$STUB" ]] && { error "No EFI stub found. Install systemd-boot or use --stub."; exit 1; }

info "Kernel: $KERNEL"
info "Initrd: $INITRD"
info "Stub:   $STUB"

# ── Step 4: Build UKI with dm-verity root hash in cmdline ────────────────────
info "Step 4/5: Building UKI"

# The root hash is embedded in the kernel cmdline so the initramfs can
# set up the dm-verity device before mounting the rootfs.
CMDLINE="rd.emergency=reboot systemd.unit=rescue.target console=tty0 \
rd.verity.root=${ROOT_HASH} \
rd.verity.data=LABEL=recovery-rootfs \
rd.verity.hash=LABEL=recovery-verity \
rd.verity.salt=${SALT}"

CMDLINE_FILE="${WORK_DIR}/cmdline.txt"
printf '%s' "$CMDLINE" > "$CMDLINE_FILE"

UKI_UNSIGNED="${WORK_DIR}/recovery-unsigned.efi"

objcopy \
  --add-section .osrel=/etc/os-release       --change-section-vma .osrel=0x20000 \
  --add-section .cmdline="$CMDLINE_FILE"     --change-section-vma .cmdline=0x30000 \
  --add-section .initrd="$INITRD"            --change-section-vma .initrd=0x3000000 \
  --add-section .linux="$KERNEL"             --change-section-vma .linux=0x2000000 \
  "$STUB" "$UKI_UNSIGNED"

UKI_SIZE=$(du -h "$UKI_UNSIGNED" | cut -f1)
info "UKI built: $UKI_UNSIGNED ($UKI_SIZE)"

# ── Step 5: Sign the UKI ─────────────────────────────────────────────────────
if [[ "$SIGN" == "true" ]]; then
  info "Step 5/5: Signing UKI with Secure Boot keys"
  sbsign \
    --key  "$KEY_PATH" \
    --cert "$CERT_PATH" \
    --output "$OUTPUT" \
    "$UKI_UNSIGNED"
  info "Signed UKI: $OUTPUT"
else
  info "Step 5/5: Skipping signing (--no-sign)"
  cp "$UKI_UNSIGNED" "$OUTPUT"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
OUTPUT_SIZE=$(du -h "$OUTPUT" | cut -f1)
info "============================================"
info "verity-uki build complete!"
info "  UKI:        $OUTPUT ($OUTPUT_SIZE)"
info "  SquashFS:   $SQUASHFS_PATH"
info "  Hash tree:  $VERITY_PATH"
info "  Root hash:  $ROOT_HASH"
info "  Signed:     $SIGN"
info "============================================"
info "To boot, copy to your ESP:"
info "  cp $OUTPUT /boot/efi/EFI/Linux/recovery-verified.efi"
info "  cp $SQUASHFS_PATH /boot/efi/recovery.squashfs"
info "  cp $VERITY_PATH /boot/efi/recovery.squashfs.verity"
