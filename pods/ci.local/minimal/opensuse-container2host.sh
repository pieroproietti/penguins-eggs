#!/bin/bash

# This script build a fedora system from container

# check if we are root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

if [ -f /etc/os-release ]; then
    source /etc/os-release
    if [[ "$ID" != "opensuse-tumbleweed" ]]; then
   	  echo "This script is only for opensuse-tumbleweed based systems"
   	  exit
    fi
fi

# update
zypper -y update

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
zypper install -y \
    systemd \
    dracut \
    grub2 \
    sudo

echo "package manager"
zypper install -y \
    zypper

echo "login e console"
zypper install -y \
    util-linux \
    e2fsprogs \
    iproute2 \
    iputils 

echo "networking"
zypper install -y \
    NetworkManager \
    hostname \
    openssh

echo "filesystem and disk support"
zypper install -y \
    btrfs-progs \
    xfsprogs \
    dosfstools \
    ntfs-3g \
    lvm2 \
    mdadm \
    cryptsetup 

echo "drivers and hw support"
zypper install -y \
    efibootmgr \
    shim 

echo "tools"
zypper install -y \
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
zypper install -y \
    strace \
    lsof \
    htop \
    hostname \
    mc \
    curl \
    wget \
    bind-utils

zypper install -y \
    multipath-tools 

echo "systemd configure/enable"
systemctl set-default multi-user.target
systemctl enable getty@tty1.service
systemctl enable systemd-networkd.service
systemctl enable NetworkManager.service
systemctl enable NetworkManager-dispatcher.service

echo "disable selinux"
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config

echo "eggs requirements"
zypper install -y \
    bash-completion \
    cryptsetup \
    curl \
    dosfstools \
    dracut \
    dracut-tools \
    fuse \
    git \
    jq \
    lsb-release \
    lvm2 \
    nodejs \
    npm \
    parted \
    rsync \
    squashfs \
    sshfs \
    wget \
    xdg-user-dirs \
    xorriso



# Enable uinput
echo "uinput" | tee /etc/modules-load.d/uinput.conf

# mkdir /usr/share/icons
mkdir -p /usr/share/icons
