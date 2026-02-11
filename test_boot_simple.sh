#!/bin/bash
# scripts/test_boot_simple.sh
# Simple helper to boot a raw image with QEMU/KVM on x86_64 using IDE/SATA (no virtio-scsi)

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

# UEFI (OVMF) configuration
OVMF_CODE=""
for f in /usr/share/ovmf/OVMF.fd /usr/share/qemu/OVMF.fd /usr/share/OVMF/OVMF.fd; do
    if [ -f "$f" ]; then
        OVMF_CODE="$f"
        break
    fi
done

BIOS_OPTS=""
if [ -n "$OVMF_CODE" ]; then
    echo "Found UEFI Firmware: $OVMF_CODE"
    BIOS_OPTS="-bios $OVMF_CODE"
else
    echo "Warning: OVMF firmware not found, expecting legacy boot or failure..."
fi

QEMU_OPTS="-m 4G -enable-kvm -cpu host -serial stdio $BIOS_OPTS"

echo "Booting $IMG with $QEMU_CMD (IDE/SATA Mode)..."
echo "Options: $QEMU_OPTS"

# Use standard -drive syntax which usually defaults to IDE or AHCI depending on machine type
$QEMU_CMD $QEMU_OPTS \
    -drive file="$IMG",format=raw
