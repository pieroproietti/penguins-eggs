#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
cd $CMD_PATH
npm install -g pnpm@latest-10
pnpm install
pnpm deb # -all 

sudo apt install -y ./perrisbrewery/workdir/penguins-eggs_*_amd64.deb

sudo eggs --version
sudo eggs dad -d
sudo eggs status
sudo eggs produce --clone -n -v

# cd $CMD_PATH
# which podman 
# podman --version
# df -h
# podman run --privileged --pull=always -v $PWD/mychroot/ci:/ci -v /dev:/dev debian:12.9 /ci/install.sh $GITHUB_REPOSITORY $GITHUB_REF_NAME $GITHUB_RUN_NUMBER
# df -h
date
