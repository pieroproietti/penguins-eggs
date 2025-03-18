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

cd $CMD_PATH
which podman 
podman --version
df -h
podman run --hostname minimal-ci --privileged --cap-add all --ulimit nofile=32000:32000 --pull=always -v $PWD/mychroot/ci:/ci -v /dev:/dev ubuntu:24.04 /ci/ubuntu-24.04-install.sh
df -h
date
