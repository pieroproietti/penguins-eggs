#!/bin/bash

# This script installs prerequisites for penguins-eggs
# on fedora linux, it is intended for development purposes 

# check if we are root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

# check if we are on fedora
if [ ! -f /etc/rocky-release ]; then
    echo "This script is intended for rocky linux only"
    exit 1
fi

if [ -f ,/nodesource_setup ]; then
    ./nodesource_setup
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
npm i pnpm -g

# mkdir /usr/share/icons
mkdir -p /usr/share/icons

# disable selinux
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config

# we lacks
# overlayfs-tools
# dmraid
