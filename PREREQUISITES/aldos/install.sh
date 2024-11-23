#!/bin/bash

# This script installs prerequisites for penguins-eggs
# on fedora linux, it is intended for development purposes 

# check if we are root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

# check if we are on fedora or NobaraLinux
if [ ! -f /etc/aldos-release ]; then
    echo "This script is intended for aldos!"
    exit 1
fi

# update
yum -y update


yum -y install \
    bash-completion \
    cryptsetup \
    curl \
    device-mapper \
    dmraid \
    dosfstools \
    dracut \
    dracut-live \
    fuse \
    git \
    grub2-tools-extra \
    jq \
    lvm2 \
    nodejs \
    parted \
    rsync \
    squashfs-tools \
    sshfs \
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
