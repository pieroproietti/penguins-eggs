#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
cd $CMD_PATH
npm install -g pnpm@latest-10
pnpm install
pnpm deb # -all 
mv ./perrisbrewery/workdir/penguins-eggs_*_amd64.deb ./mychroot/ci/
#################################################################################################################
## TODO 0
##  check the server of ci
## the server of ci is ubuntu 24.04
## the ci server is an azure vm on azure 
## Ubuntu 24.04.2 LTS \n \l

sudo cat /etc/issue
ls -al /etc/
# fix podman pull error : Get "https://registry-1.docker.io/v2/": dial tcp: lookup registry-1.docker.io on 127.0.0.53:53: read udp 127.0.0.1:53545->127.0.0.53:53: read: connection refused
sudo cat /etc/resolv.conf
sudo apt purge resolvconf -y
sudo rm /etc/resolv.conf
sudo touch /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
echo "nameserver 8.8.4.4" | sudo tee -a /etc/resolv.conf
echo "nameserver 127.0.0.53" | sudo tee -a /etc/resolv.conf
echo "options edns0 trust-ad" | sudo tee -a /etc/resolv.conf
sudo cat /etc/resolv.conf

#################################################################################################################
## TODO 1
## TEST 1
## using eggs to remaster ubuntu server ubuntu-24.04
## it failed now
## Unrecognised xattr prefix system.posix_acl_default
## see more or dowload the actions log
cd $CMD_PATH
sudo apt install -y ./mychroot/ci/penguins-eggs_*_amd64.deb
mksquashfs -version
sudo eggs dad -d
sudo eggs produce --clone -n --verbose


######################################################################################################################
# pnpm tarballs 
# mv ./dist/eggs*.tar.gz ./mychroot/ci/

######################################################################################################################
## TODO 2
## TEST 2
## using contaner image ubuntu ubuntu:24.04 on ci hosted server ubuntu-24.04 
## install same kernal with the host of the ci server
## it failed now
cd $CMD_PATH
which podman 
podman --version
df -h
podman pull ubuntu:24.04
podman pull ubuntu:24.04
podman pull ubuntu:24.04
podman run --hostname minimal-ci --privileged --cap-add all --ulimit nofile=32000:32000 --pull=always -v $PWD/mychroot/ci:/ci -v /dev:/dev ubuntu:24.04 /ci/ubuntu-24.04-install.sh
df -h
date
