#!/bin/bash

# This script installs prerequisites for penguins-eggs
# on fedora linux, it is intended for development purposes 

# check if we are root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

# check if we are on fedora or NobaraLinux
if [ ! -f /etc/fedora-release ]; then
    if [ ! -f /etc/nobara-release ]; then
        if [ ! -f /etc/openmamba-release ]; then
            echo "This script is intended for fedora, nobara or openmamba!"
            exit 1
        fi
    fi
fi

# update
dnf -y update

dnf -y --no-best install \
    bash-completion \
    cryptsetup \
    curl \
    device-mapper \
    dmraid \
    dosfstools \
    dracut \
    dracut-live \
    efibootmgr \
    fuse \
    git \
    grub2-efi-x64 \
    grub2-efi-x64-modules \
    grub2-tools-extra \
    jq \
    lvm2 \
    nvme-cli \
    overlayfs-tools \
    parted \
    rsync \
    shim \
    squashfs-tools \
    systemd-boot \
    sshfs \
    wget \
    xdg-user-dirs \
    xorriso \
    zstd

# mkdir /usr/share/icons
mkdir -p /usr/share/icons

# disable selinux
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
