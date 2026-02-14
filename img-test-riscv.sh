#!/bin/bash
# scripts/qemu-test-riscv.sh
# Simple helper to boot a raw image with QEMU/KVM on RISC-V (emulated or native)

IMG="$1"

if [ -z "$IMG" ]; then
    echo "Usage: $0 <path-to-image.img>"
    exit 1
fi

if [ ! -f "$IMG" ]; then
    echo "Error: Image file '$IMG' not found."
    exit 1
fi

# 1. Find QEMU
QEMU_CMD=""
if command -v qemu-system-riscv64 >/dev/null 2>&1; then
    QEMU_CMD="qemu-system-riscv64"
else
    echo "Error: 'qemu-system-riscv64' not found."
    exit 1
fi

# 2. Find Firmware (UEFI/EDK2)
# We look for the split CODE and VARS files provided by qemu-efi-riscv64 package
FW_DIR="/usr/share/qemu-efi-riscv64"
RISCV_CODE="$FW_DIR/RISCV_VIRT_CODE.fd"
RISCV_VARS="$FW_DIR/RISCV_VIRT_VARS.fd"
# Create a local copy of VARS to avoid writing to system location implies we need a tmp config
# but for simplicity we might initially rely on volatile or a local copy if needed.
# However, usually just mapping VARS as read-only or using a snapshot behavior is safer if we don't want persistence.
# For now, let's copy VARS to /tmp to allow saving changes.
VARS_TMP="/tmp/RISCV_VIRT_VARS.fd"

if [ -f "$RISCV_CODE" ] && [ -f "$RISCV_VARS" ]; then
    echo "Found UEFI Firmware: $RISCV_CODE"
    cp "$RISCV_VARS" "$VARS_TMP"
else
    echo "Error: UEFI Firmware not found in $FW_DIR"
    exit 1
fi

echo "Booting $IMG with $QEMU_CMD..."

# 3. Construct Command
# -machine virt: Generic RISC-V Virtual Machine
# -cpu rv64: Generic 64-bit RISC-V CPU
# -m 2G: Memory
# -device virtio-gpu-pci: Graphics
# -device virtio-keyboard-pci / -device virtio-mouse-pci: Input
# -drive ... if=pflash ...: Firmware
# -device virtio-blk-device: Storage (simpler than scsi for riscv virt usually, or use virtio-blk-pci)
# Let's use virtio-blk-device as it's standard for 'virt' machine, or virtio-blk-pci.
# virtio-blk-device implies virtio-mmio. virtio-blk-pci implies PCI. 'virt' supports PCI.
# We'll use virtio-blk-pci for better resemblance to physical PCI hardware if possible, matching the x86 script style.

$QEMU_CMD \
    -machine virt \
    -cpu rv64 \
    -m 4G \
    -smp 4 \
    -drive if=pflash,format=raw,unit=0,file="$RISCV_CODE",readonly=on \
    -drive if=pflash,format=raw,unit=1,file="$VARS_TMP" \
    -device virtio-gpu-pci \
    -device virtio-keyboard-pci \
    -device virtio-mouse-pci \
    -device virtio-scsi-pci,id=scsi0 \
    -device scsi-hd,drive=hd0,bus=scsi0.0 \
    -drive file="$IMG",format=raw,if=none,id=hd0 \
    -serial stdio \
    -display default,show-cursor=on
    # -nographic # Use this if you want only terminal output, but for testing GUI ISOs we want display.
