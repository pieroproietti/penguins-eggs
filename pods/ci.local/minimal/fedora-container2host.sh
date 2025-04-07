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

# Base: Sistema e init
echo "system base and init"
dnf -y --no-best install \
    systemd \
    dracut \
    kernel \
    grub2 \
    passwd \
    sudo

# Gestione pacchetti
echo "package manager"
dnf -y --no-best install \
    dnf \
    dnf-plugins-core

# Login e console
echo "login/console"
dnf -y --no-best install \
    util-linux \
    e2fsprogs \
    shadow-utils \
    hostname \
    iproute \
    iputils \
    procps-ng

# Networking
echo "networking"
dnf -y --no-best install \
    NetworkManager \
    dhclient \
    nss-altfiles \
    openssh-server

# File system e supporto dischi
echo "filesyste and disk support"
dnf -y --no-best install \
    btrfs-progs \
    xfsprogs \
    dosfstools \
    ntfs-3g \
    lvm2 \
    mdadm \
    cryptsetup 

# Driver e supporto hardware
echo "driver and hw support"
dnf -y --no-best install \
    linux-firmware \
    efibootmgr \
    grub2-efi \
    shim 

# Strumenti vari utili
echo "tools"
dnf -y --no-best install \
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

# optional but usefuil for debud debug / live ISO
echo "optional tools debug/live ISO"
dnf -y --no-best install \
    strace \
    lsof \
    htop \
    mc \
    curl \
    wget \
    bind-utils

# eggs
echo "eggs requirements"
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

# systemd configure/enable
echo "systemd configure/enable"
systemctl set-default multi-user.target
systemctl enable getty@tty1.service
systemctl enable systemd-networkd.service
systemctl enable NetworkManager.service
systemctl enable NetworkManager-dispatcher.service

# /etc/default/grub
cat > /etc/default/grub <<EOF
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR="Fedora"
GRUB_DEFAULT=saved
GRUB_DISABLE_SUBMENU=true
GRUB_TERMINAL_OUTPUT="console"
GRUB_CMDLINE_LINUX="rd.lvm=0 rd.md=0 rd.dm=0 quiet"
GRUB_DISABLE_RECOVERY="true"
EOF

# disable selinux
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
