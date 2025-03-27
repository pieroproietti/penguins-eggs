#!/bin/bash

# check if we are root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# check if we are on Debian/Devuan/Ubuntu
if [ -f /etc/os-release ]; then
	source /etc/os-release
  if [[ "$ID" != "debian" && "$ID_LIKE" != *"debian"* ]]; then
   	echo "This script is only for Debian/Devuan/Ubuntu based systems"
   	exit
	fi
fi

LIVE_CONFIG_INIT_SYSTEM="live-config-systemd"
if [[ "$ID" == "devuan" ]]; then
  LIVE_CONFIG_INIT_SYSTEM="live-config-sysvinit"
fi

apt-get install -y \
    coreutils \
    cryptsetup \
    curl \
    dosfstools \
    dpkg-dev \
    git \
    grub-efi-amd64-bin \
    jq \
    live-boot \
    live-boot-doc \
    live-boot-initramfs-tools \
    $LIVE_CONFIG_INIT_SYSTEM \
    live-tools \
    lvm2 \
    parted \
    rsync \
    squashfs-tools \
    sshfs \
    wget \
    xorriso