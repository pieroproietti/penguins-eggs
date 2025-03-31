#!/bin/bash

# This script installs prerequisites for penguins-eggs
# on almalinux/rocky, it is intended for development purposes 

# check if we are root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

# check if we are on rocky or almalinux
if [ ! -f /etc/almalinux-release ]; then
    if [ ! -f /etc/rocky-release ]; then
        echo "This script is intended for almalinux or rocky!"
        exit 1
    fi
fi



# add epel-release
dnf -y install epel-release 

# enable crb
dnf config-manager --set-enabled crb

# update
dnf -y update

# enable crb
dnf config-manager --set-enabled crb


# remove curl for conflicts
dnf --allowerasing -y install \
    bash-completion \
    cryptsetup \
    curl \
    device-mapper \
    dosfstools \
    dracut \
    dracut-live \
    efibootmgr \
    fuse \
    git \
    grub2-efi-x64 \
    grub2-efi-modules \
    grub2-efi-x64-modules \
    grub2-tools-extra \
    jq \
    lvm2 \
    nvme-cli \
    parted \
    rsync \
    shim \
    squashfs-tools \
    sshfs \
    tar \
    wget \
    xdg-user-dirs \
    xorriso \
    zstd

# mkdir /usr/share/icons
mkdir -p /usr/share/icons

# disable selinux
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
