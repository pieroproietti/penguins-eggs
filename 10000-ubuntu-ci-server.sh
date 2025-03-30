#!/usr/bin/env bash
## WARNING WHEN CHANGING CI FILES

### 1. don't change ci files if you are not sure
### 2. don't change ci files if it is not necessary
### 3. don't disable any one of ci tests
### 4. don't change the current workflow of build iso
### 5. don't change the number of ci files, just add new files with a new number range such as 30000- 40000 50000
### 6. if you want to use penguins-wardroe to build,add new ci tests and don't change the current ci files and workflows

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
cd $CMD_PATH
###############################################################################################################
# check overlay on ci server
grep overlay /proc/filesystems
sudo modprobe overlay
pwd
env
whoami

###############################################################################################################
npm install -g pnpm@latest-10
pnpm install
pnpm tarballs --release 15
rsync -a ./dist/penguins-eggs_10.0.60-*-linux-x64.tar.gz ./mychroot/ci/
ls -al ./mychroot/ci/
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
