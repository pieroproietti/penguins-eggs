#!/bin/bash

# This script installs prerequisites for penguins-eggs
# on fedora linux, it is intended for development purposes 

# check if we are root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

# check if we are on rocky or almalinux
if [ ! -f /etc/rocky-release ]; then
    if [ ! -f /etc/almalinux-release ]; then
        echo "This script is intended for rockylinux or almalinux!"
        exit 1
    fi
fi

if [ -f ,/nodesource_setup.sh ]; then
    ./nodesource_setup.sh
fi

# add epel-release
dnf install epel-release

# enable crb
dnf config-manager --set-enabled crb

# update
dnf -y update

# enable crb
dnf config-manager --set-enabled crb

dnf -y install \
    bash-completion \
    cryptsetup \
    curl \
    device-mapper \
    dosfstools \
    dracut \
    dracut-live \
    fuse \
    git \
    grub2-efi-x64 \
    grub2-efi-x64-modules \
    grub2-tools-extra \
    jq \
    lsb-release \
    lvm2 \
    nodejs \
    nvme-cli \
    parted \
    rsync \
    sshfs \
    squashfs-tools \
    wget \
    xdg-user-dirs \
    xorriso \
    zstd

# install pnpm
npm i pnpm@8 -g

# mkdir /usr/share/icons
mkdir -p /usr/share/icons

# disable selinux
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
