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

# packages to be added for a minimum standard installation
apt install \
    bash-completion \
    dialog \
    dnsutils \
    git \
    iproute2 \
    iputils-ping \
    less \
    locales \
    man \
    man-db \
    manpages \
    nano \
    net-tools \
    procps \
    sudo \
    systemd-sysv \
    tzdata \
    vim -y


# We must install the same version of the host
apt install linux-image-$(uname -r) -y

# init /usr/share/applications
dpkg -S /usr/share/applications

apt install python3 -y
ls -al /usr/share/applications

# fix linuxefi.mod
apt-file update
apt-file search linuxefi.mod
apt install grub-efi-amd64-bin -y

# starting with eggs
cd /ci/
ls -al
apt install -y ./*.deb

eggs dad -d
eggs produce --pendrive -n --verbose

# clean debs on /ci
rm /ci/*.deb

date

echo "# enable bash_completion, running:"
echo "source /etc/bash_completion"
