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
pacman -Syu --needed --noconfirm \
base-devel \
bash-completion \
linux-firmware \
linux-firmware-whence

echo "package manager"
pacman -Syu --needed --noconfirm \
fakeroot \
pkgconf

echo "login e console"
pacman -Syu --needed --noconfirm \
sudo \
dialog \
nano

echo "networking"
pacman -Syu --needed --noconfirm \
networkmanager \
inetutils \
openssh

echo "filesystem and disk support"
pacman -Syu --needed --noconfirm \
zram-generator \
syslinux

echo "drivers and hw support"
pacman -Syu --needed --noconfirm \
linux-firmware \
linux-firmware-whence

echo "tools"
pacman -Syu --needed --noconfirm \
which \
patch \
make \
gcc \
gc \
man-db \
texinfo

echo "optional tools debug/live ISO"
pacman -Syu --needed --noconfirm \
debugedit \
groff \
guile \
m4

echo "systemd configure/enable"
systemctl set-default multi-user.target
systemctl enable getty@tty1.service
systemctl enable systemd-networkd.service
systemctl enable NetworkManager.service
systemctl enable NetworkManager-dispatcher.service

echo "eggs requirements"
pacman -Syu --noconfirm --needed \
	arch-install-scripts \
	cryptsetup \
	dosfstools \
	efibootmgr \
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
	nbd \
	nodejs \
	pacman-contrib \
	parted \
	procps-ng \
	pv \
	python \
	rsync \
	squashfs-tools \
	sshfs \
	wget \
	xorriso \
	xdg-utils

    # mkdir /usr/share/icons
    mkdir -p /usr/share/icons

	# enable sudo for wheel group
	sed -i 's/# %wheel ALL=(ALL) ALL/%wheel ALL=(ALL) ALL/g' /etc/sudoers
