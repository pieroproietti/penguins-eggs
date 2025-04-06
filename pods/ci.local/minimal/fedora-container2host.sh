#!/bin/bash

# This script build a fedora system from container

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

# eggs requirements
dnf -y --no-best install \
    bash-completion \
    console-setup \
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
    systemd \
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

# minimal 
dnf -y --no-best install \
    nano \
    NetworkManager \
    passwd \
    sudo \
    util-linux \
    e2fsprogs \
    shadow-utils \
    hostname \
    iproute \
    iputils \
    procps-ng


# systemd configure/enable
systemctl set-default multi-user.target
systemctl enable getty@tty1.service
systemctl enable systemd-networkd.service
systemctl enable NetworkManager.service
systemctl enable NetworkManager-dispatcher.service

