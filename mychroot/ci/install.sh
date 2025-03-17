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
echo -e "127.0.0.1  localhost\n" > /etc/hosts
echo -e "127.0.1.1   $(hostname)\n" >> /etc/hosts

# This host address
127.0.1.1  colibri

####################################################################################################################################
# 3 ppa install penguins-eggs

cd $CMD_PATH
apt update -y
apt upgrade -y
apt install sudo -y
apt install git -y
apt install linux-image-6.1.0-30-amd64 -y
apt install systemd-sysv -y

# init /usr/share/applications
dpkg -S /usr/share/applications

apt install python3 -y
ls -al /usr/share/applications

# fix linuxefi.mod
apt-file update
apt-file search linuxefi.mod
apt install grub-efi-amd64-bin -y


cd /ci/
ls -al
apt install -y ./*.deb

eggs --version
eggs dad -d
eggs produce --pendrive -n

# remove debs
rm /ci/penguins-eggs_10*.deb

date
