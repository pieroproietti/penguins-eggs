#!/bin/bash

# This script installs prerequisites for penguins-eggs
# on manjaro/biglinux, it is intended for development purposes 

# check if the script is running as root
if [ "$EUID" -ne 0 ]; then
	echo "Please run as root"
	exit
fi

# check if the script is running on arch linux
if [[ ! -f /etc/arch-release ]]; then
	echo "This script is only for Manjaro Linux"
	exit
fi
# efibootmgr

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
	lsb-release \
	lvm2 \
	manjaro-tools-iso \
	mkinitcpio-nfs-utils \
	mtools \
	nbd \
	nodejs \
	pacman-contrib \
	parted \
	pnpm \
	procps-ng \
	pv \
	python \
	rsync \
	squashfs-tools \
	sshfs \
	wget \
	xdg-utils \
	zsh-completions

    # mkdir /usr/share/icons
    mkdir -p /usr/share/icons
