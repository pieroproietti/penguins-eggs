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

echo " packages to be added for a minimal standard installation"
pacman -Syu --needed --noconfirm \
autoconf \
automake \
base-devel \
bash-completion \
bison \
debugedit \
dialog \
fakeroot \
flex \
gc \
gcc \
groff \
guile \
inetutils \
kdb \
libisl \
libmpc \
libtool \
linux-firmware \
linux-firmware-whence \
m4 \
make \
man-db \
nano \
networkmanager \
openssh \
patch \
pkgconf \
sudo \
syslinux \
texinfo \
which \
zram-generator \
zstd


# systemd minimal configure/enable
systemctl set-default multi-user.target
systemctl enable getty@tty1.service
systemctl enable systemd-networkd.service
systemctl enable NetworkManager.service
systemctl enable NetworkManager-dispatcher.service

