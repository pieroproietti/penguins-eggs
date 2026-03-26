#!/bin/bash
# detect-disks.sh -- Detect and display disk layout for rescue operations.
#
# Outputs a summary of all block devices, their partitions, filesystem types,
# mount points, and LUKS encryption status.

set -euo pipefail

echo "=== Block Devices ==="
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,LABEL,UUID

echo ""
echo "=== LUKS Encrypted Partitions ==="
blkid | grep -i crypto_LUKS || echo "  (none detected)"

echo ""
echo "=== LVM Volumes ==="
if command -v lvs &>/dev/null; then
    lvs 2>/dev/null || echo "  (no LVM volumes)"
else
    echo "  (lvs not available)"
fi

echo ""
echo "=== EFI System Partitions ==="
blkid | grep -i 'TYPE="vfat"' || echo "  (none detected)"

echo ""
echo "=== Mount Points ==="
findmnt --real --noheadings -o TARGET,SOURCE,FSTYPE 2>/dev/null || mount | grep '^/dev'
