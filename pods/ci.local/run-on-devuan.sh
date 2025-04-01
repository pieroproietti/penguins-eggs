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

# init /usr/share/applications
dpkg -S /usr/share/applications

apt install python3 -y
ls -al /usr/share/applications

# fix linuxefi.mod
apt-file update
apt-file search linuxefi.mod
apt install grub-efi-amd64-bin -y

# sysvinit
apt install sysvinit -y

# packages to be added for a minimum standard installation
source ./minimal/debian-packages.sh

# packages to be added tarballs
source ./minimal/debian-tarballs-requirements.sh

# installing ggs
source ./penguins-eggs-tarballs-install.sh

# test mount -t overlay / install kernel
source ./kernel-overlay-install.sh

# execute eggs
source ./penguins-eggs-execute.sh $1