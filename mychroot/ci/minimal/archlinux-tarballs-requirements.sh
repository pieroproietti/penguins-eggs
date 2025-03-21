#!/bin/bash

# check if we are root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# check if we are on arch
if [ -f /etc/os-release ]; then
	source /etc/os-release
    if [[ "$ID" != "arch" ]]; then
    	echo "This script is only for Arch"
    	exit
	fi
fi

pacman -Syu --noconfirm --needed \
		arch-install-scripts \
		bash-completion \
		dosfstools \
		erofs-utils \
		findutils \
		git \
		grub \
		jq \
		libarchive \
		libisoburn \
		lvm2 \
		mkinitcpio-archiso \
		mkinitcpio-nfs-utils \
		mtools \
		nano \
		nbd \
		pacman-contrib \
		parted \
		procps-ng \
		pv \
		python \
		rsync \
		squashfs-tools \
		sshfs \
		syslinux \
		wget \
		xdg-utils \
        xdg-user-dirs \
		xorriso

    # mkdir /usr/share/icons
    mkdir -p /usr/share/icons

	# enable sudo for wheel group
	sed -i 's/# %wheel ALL=(ALL) ALL/%wheel ALL=(ALL) ALL/g' /etc/sudoers
