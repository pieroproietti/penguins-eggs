#!/bin/bash
# Generate and merge kernel config: defconfig + initramfs uid/gid + minimal rescue options.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "${SCRIPT_DIR}/build/linux"

echo "Generating defconfig..."
nice -19 make defconfig

echo "Merging rescue kernel config..."
echo "CONFIG_INITRAMFS_ROOT_UID=$(id -u)" >  "${SCRIPT_DIR}/build/config.initramfs_root"
echo "CONFIG_INITRAMFS_ROOT_GID=$(id -g)" >> "${SCRIPT_DIR}/build/config.initramfs_root"

nice -19 ./scripts/kconfig/merge_config.sh \
    .config \
    "${SCRIPT_DIR}/build/config.initramfs_root" \
    "${SCRIPT_DIR}/zfiles/config.minimal"
