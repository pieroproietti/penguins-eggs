#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
export NEEDRESTART_MODE=a
export DEBIAN_FRONTEND=noninteractive

####################################################################################################################################
# 1 check
cd $CMD_PATH
env
pwd
whoami
ls

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
apt update -y
apt upgrade -y

# We must install the same version of the host
apt install linux-image-generic -y

# packages to be added for a minimum standard installation
source ./minimal/ubuntu-packages.sh

# packages to be added tarballs
source ./minimal/debian-tarballs-requirements.sh

# nodejs, npm
apt install nodejs npm -y

# fix linuxefi.mod
apt-file update
apt-file search linuxefi.mod
apt install grub-efi-amd64-bin -y

# fix /etc/inittab
systemctl set-default multi-user.target

# installing ggs
source ./penguins-eggs-tarballs-install.sh

# test mount -t overlay
source ./overlay-test.sh

# using eggs
eggs dad -d
eggs tools clean -n
eggs produce --pendrive -n
echo "TIPS use: eggs export iso -c"

# save iso to the host server
mv /home/eggs/.mnt/*.iso /ci/iso/
ls -al /ci/iso/
