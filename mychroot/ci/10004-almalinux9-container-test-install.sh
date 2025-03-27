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
dnf -y update 

# install shasum
dnf install -y perl-Digest-SHA

# We must install the same version of the host
 dnf -y install kernel

# packages to be added for a minimum standard installation
#source ./minimal/almalinux-packages.sh


# packages to be added tarballs
source ./minimal/almalinux-tarballs-requirements.sh

# installing ggs
source ./penguins-eggs-tarballs-install.sh

# using eggs
eggs dad -d
eggs tools clean -n
eggs produce --pendrive -n
