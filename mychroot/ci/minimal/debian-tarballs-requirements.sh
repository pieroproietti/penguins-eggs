#!/bin/bash

# check if we are root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# check if we are on arch
if [ -f /etc/os-release ]; then
	source /etc/os-release
    if [[ "$ID" != "debian" ]]; then
    	echo "This script is only for Debina"
    	exit
	fi
fi

clear
echo "penguins-eggs-tarballs-requisites"
sleep 3

# install prerequisites
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
    live-config-systemd \
    live-tools \
    lvm2 \
    parted \
    rsync \
    squashfs-tools \
    sshfs \
    wget \
    xorriso