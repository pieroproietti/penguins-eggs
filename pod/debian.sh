#!/usr/bin/env bash

set -x

# remove previous images
podman rmi $(podman images --quiet) -f

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
echo $PROJECT_NAME
cd $CMD_PATH
sudo npm install -g pnpm@latest-10
pnpm install
pnpm deb --release 14
# here we are in /pod, so...
mv ../perrisbrewery/workdir/penguins-eggs_*_amd64.deb ../mychroot/ci/

cd $CMD_PATH
which podman 
podman --version
df -h
podman run --hostname minimal --privileged --cap-add all --ulimit nofile=32000:32000 --pull=always -it -v $PWD/mychroot/ci:/ci -v /dev:/dev -v /var/local/yolk:/var/local/yolk debian:12.9 bash
# # when you are in the container, just run as the following:
# cd /ci/
# ls -al
# ./debian-12.9-install.sh
# #do something

# #end it
# exit
df -h
date
