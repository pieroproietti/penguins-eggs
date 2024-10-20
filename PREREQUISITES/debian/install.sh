!#/bin/bash

# check if we are root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# check if we are on debian
if [ ! -f /etc/os-release ]; then
    echo "This script is only for Debian"
    exit
fi

# install prerequisites
apt-get install -y \
    coreutils \
    cryptsetup \
    curl \
    dosfstools \
    dpkg-dev \
    git \
    grub-efi-amd64-bin \
    isolinux \
    jq \
    live-boot \
    live-boot-doc \
    live-boot-initramfs-tools \
    live-config-systemd \
    live-tools \
    lsb-release \
    lvm2 \
    nodejs \
    npm \
    parted \
    pxelinux \
    rsync \
    squashfs-tools \
    sshfs \
    xorriso

# Install pnpm
npm i pnpm -g

