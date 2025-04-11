#!/bin/bash

# This script build an almalinux system from container

set -x

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

# update
dnf -y update

# add epel-release
dnf -y install epel-release 

# enable crb
dnf config-manager --set-enabled crb

# update
dnf -y update

# enable crb
dnf config-manager --set-enabled crb

# echo "base: system e init"
# echo "package manager"
# echo "login e console"
# echo "networking"
# echo "filesystem and disk support"
# echo "drivers and hw support"
# echo "tools"
# echo "optional tools debug/live ISO"
# echo "systemd configure/enable"
# echo "generate /etc/default/grub"
# echo "eggs requirements"

echo "base: system e init"
dnf -y --nobest install \
    systemd \
    dracut \
    kernel \
    grub2 \
    passwd \
    sudo

echo "package manager"
dnf -y --nobest install \
    dnf \
    dnf-plugins-core

echo "login e console"
dnf -y --nobest install \
    util-linux \
    e2fsprogs \
    shadow-utils \
    hostname \
    iproute \
    iputils \
    procps-ng

echo "networking"
dnf -y --nobest install \
    NetworkManager \
    dhclient \
    nss-altfiles \
    openssh-server

echo "filesystem and disk support"
dnf -y --nobest install \
    btrfs-progs \
    xfsprogs \
    dosfstools \
    ntfs-3g \
    lvm2 \
    mdadm \
    cryptsetup 

echo "drivers and hw support"
dnf -y --nobest install \
    linux-firmware \
    efibootmgr \
    grub2-efi \
    shim 

echo "tools"
dnf -y --nobest install \
    bash-completion \
    vim \
    nano \
    less \
    rsyslog \
    coreutils \
    findutils \
    grep \
    sed \
    awk \
    tar \
    gzip \
    xz

echo "optional tools debug/live ISO"
dnf -y --nobest install \
    strace \
    lsof \
    htop \
    mc \
    curl \
    wget \
    bind-utils

echo "systemd configure/enable"
systemctl set-default multi-user.target
systemctl enable getty@tty1.service
systemctl enable systemd-networkd.service
systemctl enable NetworkManager.service
systemctl enable NetworkManager-dispatcher.service

echo "generate /etc/default/grub"

echo "disable selinux"
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config

echo "eggs requirements"
dnf -y --nobest --allowerasing install \
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
