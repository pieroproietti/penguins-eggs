#!/bin/bash

# check if we are root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# check if we are on Debian/Devuan/Ubuntu
if [ -f /etc/os-release ]; then
	source /etc/os-release
  if [[ "$ID" != "almalinux"  ]]; then
   	echo "This script is only for Almalinux based systems"
   	exit
	fi
fi

dnd install -y \
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