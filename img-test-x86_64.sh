#!/bin/bash
# scripts/qemu-test.sh
# Simple helper to boot a raw image with QEMU/KVM on x86_64

IMG="$1"

if [ -z "$IMG" ]; then
    echo "Usage: $0 <path-to-image.img>"
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

# Try to find OVMF firmware for UEFI boot
# Try to find OVMF firmware for UEFI boot
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

QEMU_OPTS="-m 4G -enable-kvm -cpu host"

if [ -n "$OVMF_CODE" ]; then
    echo "Found UEFI Firmware: $OVMF_CODE"
    QEMU_OPTS="$QEMU_OPTS -bios $OVMF_CODE"
else
    echo "Warning: OVMF firmware not found, attempting legacy boot..."
fi

echo "Booting $IMG with $QEMU_CMD..."
echo "Options: $QEMU_OPTS"

$QEMU_CMD $QEMU_OPTS \
    -device virtio-scsi-pci,id=scsi0 \
    -device scsi-hd,drive=hd0,bus=scsi0.0 \
    -drive file="$IMG",format=raw,if=none,id=hd0
