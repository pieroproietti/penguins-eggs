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

clear
echo "packages to be added for a minimal standard installation"
sleep 3

# packages to be added for a minimal standard installation
pacman -Syu --needed --noconfirm \
autoconf \
automake \
base-devel \
bison \
debugedit \
fakeroot \
flex \
gc \
gcc \
groff \
guile \
libisl \
libmpc \
libtool \
linux-firmware \
linux-firmware-whence \
m4 \
make \
patch \
pkgconf \
sudo \
texinfo \
which \
zram-generator
