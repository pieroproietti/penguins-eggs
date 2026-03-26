#!/bin/bash
# Install recovery packages into the Alpine minirootfs via unshare chroot.
# Mirrors the penguins-recovery common/tool-lists/alpine package set.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Provide DNS for apk inside the chroot
cat "${SCRIPT_DIR}/zfiles/resolv.conf" > "${SCRIPT_DIR}/build/alpine-minirootfs/etc/resolv.conf"

unshare -mr chroot "${SCRIPT_DIR}/build/alpine-minirootfs" /bin/ash <<'EOF'
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

apk update
apk upgrade

# Core userland and rescue tools (aligned with common/tool-lists/alpine)
apk add \
    openrc busybox-openrc busybox-mdev-openrc haveged \
    bash gawk grep sed util-linux unzip tar zstd mtools \
    font-terminus kbd \
    nano vim \
    parted efibootmgr gptfdisk \
    lvm2 cryptsetup dmraid mdadm \
    e2fsprogs e2fsprogs-extra dosfstools xfsprogs btrfs-progs \
    testdisk

# Man pages
apk add mandoc \
    util-linux-doc \
    parted-doc efibootmgr-doc dmraid-doc mdadm-doc lvm2-doc \
    cryptsetup-doc gptfdisk-doc \
    e2fsprogs-doc dosfstools-doc xfsprogs-doc btrfs-progs-doc

# Trim apk cache and vim docs to keep image small
rm -f /var/cache/apk/*
rm -rf /usr/share/vim/*/doc/*
EOF
