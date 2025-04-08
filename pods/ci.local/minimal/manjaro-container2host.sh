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
