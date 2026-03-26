#!/bin/bash
# build.sh -- Build a rescue Unified Kernel Image using efi-mkuki.
#
# This is a lightweight alternative to builders/uki/ (which uses mkosi +
# systemd-ukify). It requires only POSIX shell tools, objcopy, and an
# EFI stub -- no Go, no systemd build tools.
#
# Usage:
#   sudo ./build.sh [options]
#
# Options:
#   --output <path>     Output UKI file (default: rescue.efi)
#   --kernel <path>     Kernel image (default: auto-detect from /boot)
#   --initrd <path>     Initramfs image (default: auto-detect from /boot)
#   --cmdline <string>  Kernel command line (default: rescue mode)
#   --stub <path>       EFI stub (default: auto-detect systemd-stub)
#   --osrelease <path>  os-release file (default: /etc/os-release)
#   --sign              Sign the UKI with sbctl after building
#   --help              Show this help
#
# Dependencies:
#   - efi-mkuki (or objcopy + objdump from binutils)
#   - An EFI stub (systemd-stub or similar)
#   - Optional: sbctl for signing

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Defaults
OUTPUT="rescue.efi"
KERNEL=""
INITRD=""
CMDLINE="rd.emergency=reboot systemd.unit=rescue.target console=tty0"
STUB=""
OSRELEASE="/etc/os-release"
SIGN="false"

info()  { echo -e "\033[1;32m[uki-lite]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[uki-lite]\033[0m $*"; }
error() { echo -e "\033[1;31m[uki-lite]\033[0m $*" >&2; }

usage() {
    sed -n '2,/^$/s/^# //p' "$0"
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --output)    OUTPUT="$2"; shift 2 ;;
        --kernel)    KERNEL="$2"; shift 2 ;;
        --initrd)    INITRD="$2"; shift 2 ;;
        --cmdline)   CMDLINE="$2"; shift 2 ;;
        --stub)      STUB="$2"; shift 2 ;;
        --osrelease) OSRELEASE="$2"; shift 2 ;;
        --sign)      SIGN="true"; shift ;;
        --help|-h)   usage ;;
        *) error "Unknown option: $1"; usage ;;
    esac
done

if [ "$EUID" -ne 0 ]; then
    warn "Not running as root. Some auto-detection may fail."
fi

# --- Auto-detect kernel ---
if [ -z "$KERNEL" ]; then
    for candidate in \
        /boot/vmlinuz-linux \
        /boot/vmlinuz-"$(uname -r)" \
        /boot/vmlinuz \
        ; do
        if [ -f "$candidate" ]; then
            KERNEL="$candidate"
            break
        fi
    done
fi

if [ -z "$KERNEL" ] || [ ! -f "$KERNEL" ]; then
    error "No kernel found. Specify with --kernel."
    exit 1
fi

# --- Auto-detect initrd ---
if [ -z "$INITRD" ]; then
    for candidate in \
        /boot/initramfs-linux.img \
        /boot/initrd.img-"$(uname -r)" \
        /boot/initramfs-"$(uname -r)".img \
        /boot/initrd.img \
        /boot/initrd \
        ; do
        if [ -f "$candidate" ]; then
            INITRD="$candidate"
            break
        fi
    done
fi

if [ -z "$INITRD" ] || [ ! -f "$INITRD" ]; then
    error "No initrd found. Specify with --initrd."
    exit 1
fi

# --- Auto-detect EFI stub ---
if [ -z "$STUB" ]; then
    for candidate in \
        /usr/lib/systemd/boot/efi/linuxx64.efi.stub \
        /usr/lib/gummiboot/linuxx64.efi.stub \
        /usr/lib/boot/efi/linuxx64.efi.stub \
        ; do
        if [ -f "$candidate" ]; then
            STUB="$candidate"
            break
        fi
    done
fi

if [ -z "$STUB" ] || [ ! -f "$STUB" ]; then
    error "No EFI stub found. Install systemd-boot or specify with --stub."
    exit 1
fi

info "Building rescue UKI"
info "  Kernel:   $KERNEL"
info "  Initrd:   $INITRD"
info "  Stub:     $STUB"
info "  Cmdline:  $CMDLINE"
info "  Output:   $OUTPUT"

# --- Build the UKI ---
# Try efi-mkuki first, fall back to manual objcopy
if command -v efi-mkuki &>/dev/null; then
    info "Using efi-mkuki"
    efi-mkuki \
        -s "$STUB" \
        -k "$KERNEL" \
        -i "$INITRD" \
        -c "$CMDLINE" \
        -o "$OSRELEASE" \
        "$OUTPUT"
else
    info "efi-mkuki not found, using objcopy directly"

    if ! command -v objcopy &>/dev/null; then
        error "objcopy not found. Install binutils."
        exit 1
    fi

    # Write cmdline to a temp file (must be null-terminated for the stub)
    CMDLINE_FILE=$(mktemp)
    echo -n "$CMDLINE" > "$CMDLINE_FILE"

    # Query the stub's section layout to find the right virtual addresses.
    # The UKI spec places sections after the stub's existing sections.
    # We use a simplified approach: start at a high offset and let the
    # PE loader handle alignment.
    #
    # Section order per UAPI spec: .osrel, .cmdline, .initrd, .linux
    objcopy \
        --add-section .osrel="$OSRELEASE"     --change-section-vma .osrel=0x20000 \
        --add-section .cmdline="$CMDLINE_FILE" --change-section-vma .cmdline=0x30000 \
        --add-section .initrd="$INITRD"        --change-section-vma .initrd=0x3000000 \
        --add-section .linux="$KERNEL"         --change-section-vma .linux=0x2000000 \
        "$STUB" "$OUTPUT"

    rm -f "$CMDLINE_FILE"
fi

if [ ! -f "$OUTPUT" ]; then
    error "UKI build failed."
    exit 1
fi

UKI_SIZE=$(du -h "$OUTPUT" | cut -f1)
info "UKI built: $OUTPUT ($UKI_SIZE)"

# --- Optional: sign with sbctl ---
if [ "$SIGN" = "true" ]; then
    if command -v sbctl &>/dev/null; then
        info "Signing UKI with sbctl..."
        sbctl sign -s "$OUTPUT" && info "UKI signed." || error "Signing failed."
    else
        warn "sbctl not found. Skipping signing."
    fi
fi

info "Done. To boot, copy $OUTPUT to your ESP:"
info "  cp $OUTPUT /boot/efi/EFI/Linux/rescue.efi"
