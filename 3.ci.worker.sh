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
sudo cat /etc/issue
ls -al /etc/
#################################################################################################################
## TODO 1
## TEST 1
## using eggs to remaster ubuntu server ubuntu-24.04
## it failed now
## Unrecognised xattr prefix system.posix_acl_default
## see more or dowload the actions log

sudo apt install -y ./perrisbrewery/workdir/penguins-eggs_*_amd64.deb

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
podman run --hostname minimal-ci --privileged --cap-add all --ulimit nofile=32000:32000 --pull=always -v $PWD/mychroot/ci:/ci -v /dev:/dev ubuntu:24.04 /ci/ubuntu-24.04-install.sh
df -h
date
