#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
export NEEDRESTART_MODE=a

####################################################################################################################################
# 1 check
cd $CMD_PATH
env
pwd
whoami

####################################################################################################################################
# 2 hostname
echo -e "$(hostname)\n" > /etc/hostname

# 2.1 hosts
echo -e "\
127.0.0.1  localhost
::1        localhost ip6-localhost ip6-loopback
ff02::1    ip6-allnodes
ff02::2    ip6-allrouters
# This host address
127.0.1.1   $(hostname)" > /etc/hosts

####################################################################################################################################
# penguins-eggs mininal requisites for debian bookworm

cd $CMD_PATH
pacman -Syu --noconfirm

# packages to be added for a minimum standard installation

# packages minimal
source ./minimal/archlinux-packages.sh

# packages to be added tarballs
source ./minimal/archlinux-tarballs-requirements.sh

# shasum fix
ln -s /usr/bin/core_perl/shasum /usr/bin/shasum

# installing eggs
source ./penguins-eggs-install.sh

# test mount -t overlay
source ./kernel-overlay-install.sh

# THIS DISTRO ONLY
# remove VERSION_ID as standard in arch systems
sed -i '/^VERSION_ID=/d' /etc/os-release

# enable group wheel
sed -i 's/^# \(%wheel ALL=(ALL:ALL) ALL\)/\1/' /etc/sudoers

# systemd
systemctl set-default multi-user.target
systemctl enable getty@tty1.service

# execute eggs
source ./penguins-eggs-execute.sh

