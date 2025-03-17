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
# 3 ppa install penguins-eggs

cd $CMD_PATH
apt update -y
apt upgrade -y
apt install sudo -y
apt install git -y
apt install linux-image-amd64 -y
# init /usr/share/applications
dpkg -S /usr/share/applications
apt install python3 -y
ls -al /usr/share/applications

# fix linuxefi.mod
apt-file update
apt-file search linuxefi.mod
apt install grub2 -y
apt install grub-efi-amd64-bin -y



cd /ci/
ls -al
apt install -y ./*.deb

eggs --version
eggs dad -d
eggs status
eggs produce -n -v

date
