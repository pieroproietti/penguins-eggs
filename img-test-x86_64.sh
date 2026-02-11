#!/bin/bash
# scripts/qemu-test.sh
# Simple helper to boot a raw image with QEMU/KVM on x86_64


# Parse arguments
USE_UBOOT=false
POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --u-boot)
      USE_UBOOT=true
      shift # past argument
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      POSITIONAL_ARGS+=("$1")
      shift # past argument
      ;;
  esac
done

set -- "${POSITIONAL_ARGS[@]}" # restore positional parameters

IMG="$1"

if [ -z "$IMG" ]; then
    echo "Usage: $0 <path-to-image.img> [--u-boot]"
    exit 1
fi

if [ ! -f "$IMG" ]; then
    echo "Error: Image file '$IMG' not found."
    exit 1
fi

# Try to find kvm or qemu-system-x86_64
QEMU_CMD=""
if command -v kvm >/dev/null 2>&1; then
    QEMU_CMD="kvm"
elif command -v qemu-system-x86_64 >/dev/null 2>&1; then
    QEMU_CMD="qemu-system-x86_64"
else
    echo "Error: neither 'kvm' nor 'qemu-system-x86_64' found."
    exit 1
fi

BIOS_OPTS=""

if [ "$USE_UBOOT" = true ]; then
    # U-Boot configuration
    UBOOT_ROM=""
    # Check common locations for qemu-x86 u-boot.rom
    for f in /usr/lib/u-boot/qemu-x86_64/u-boot.rom /usr/lib/u-boot/qemu-x86/u-boot.rom /usr/share/qemu/u-boot.rom; do
        if [ -f "$f" ]; then
            UBOOT_ROM="$f"
            break
        fi
    done

    if [ -n "$UBOOT_ROM" ]; then
        echo "Found U-Boot ROM: $UBOOT_ROM"
        BIOS_OPTS="-bios $UBOOT_ROM"
    else
        echo "Error: U-Boot ROM not found. Please install u-boot-qemu package."
        exit 1
    fi

else
    # UEFI (OVMF) configuration (Default)
    OVMF_CODE=""
    # Prioritize unified OVMF.fd (common in /usr/share/ovmf/) which works with -bios
    # Avoid OVMF_CODE_*.fd with -bios as they require pflash pairing with VARS
    for f in /usr/share/ovmf/OVMF.fd /usr/share/qemu/OVMF.fd /usr/share/OVMF/OVMF.fd; do
        if [ -f "$f" ]; then
            OVMF_CODE="$f"
            break
        fi
    done

    # Fallback: if we only find code parts (should ideally implement pflash logic, but let's try to detect valid unified ones first)
    if [ -z "$OVMF_CODE" ]; then
        for f in /usr/share/OVMF/OVMF_CODE_4M.fd /usr/share/OVMF/OVMF_CODE.fd; do
            if [ -f "$f" ]; then
                 echo "Warning: Found split OVMF code $f. This might fail with -bios."
                 OVMF_CODE="$f"
                 break
            fi
        done
    fi

    if [ -n "$OVMF_CODE" ]; then
        echo "Found UEFI Firmware: $OVMF_CODE"
        BIOS_OPTS="-bios $OVMF_CODE"
    else
        echo "Warning: OVMF firmware not found, attempting legacy boot..."
    fi
fi

QEMU_OPTS="-m 4G -enable-kvm -cpu host -serial stdio"

if [ -n "$BIOS_OPTS" ]; then
    QEMU_OPTS="$QEMU_OPTS $BIOS_OPTS"
fi

echo "Booting $IMG with $QEMU_CMD..."
echo "Options: $QEMU_OPTS"

if [ "$USE_UBOOT" = true ]; then
    # U-Boot on x86:
    # 1. Likes virtio-blk
    # 2. Often crashes on VGA Option ROMs (Exception 13), so use -vga none
    # 3. KVM can sometimes interfere with U-Boot's detailed low-level initialization in qemu-x86.
    
    # FORCE qemu-system-x86_64 directly to avoid 'kvm' wrapper implied flags
    QEMU_CMD="qemu-system-x86_64"
    
    # Strip -enable-kvm and -cpu host (use default qemu64 or max for TCG)
    QEMU_OPTS_NOKVM=$(echo "$QEMU_OPTS" | sed 's/-enable-kvm//' | sed 's/-cpu host/-cpu max/')
    
    echo "Booting with U-Boot (TCG mode, NO KVM)..."
    echo "Command: $QEMU_CMD $QEMU_OPTS_NOKVM -vga std -drive file=\"$IMG\",format=raw,if=virtio"

    $QEMU_CMD $QEMU_OPTS_NOKVM -vga std \
        -drive file="$IMG",format=raw,if=virtio
else
# Default for EFI/BIOS
    $QEMU_CMD $QEMU_OPTS \
        -device virtio-scsi-pci,id=scsi0 \
        -device scsi-hd,drive=hd0,bus=scsi0.0 \
        -drive file="$IMG",format=raw,if=none,id=hd0
fi
