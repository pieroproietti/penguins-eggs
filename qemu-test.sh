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

echo "Booting $IMG with $QEMU_CMD..."
$QEMU_CMD -m 2G -drive file="$IMG",format=raw
