#!/usr/bin/env bash

set -x

# remove previous images
podman rmi $(podman images --quiet) -f

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
echo $PROJECT_NAME
cd $CMD_PATH

# replace tarballs
TARBALLS="eggs-v10.0.60-*-linux-x64.tar.gz "
rm ../mychroot/ci/$TARBALLS
cp ../dist/$TARBALLS ../mychroot/ci/

podman run --name container_arch \
            --hostname minimal \
            --privileged \
            --ulimit nofile=32000:32000 \
            --pull=always \
            -it \
            -v $PWD/mychroot/ci:/ci \
            -v /dev:/dev \
            archlinux \
            bash

cd $CMD_PATH
which podman 
podman --version
df -h

# se l'host non è debian

# # when you are in the container, just run as the following:
# cd /ci/
# ls -al
# ./debian-12.9-install.sh
# #do something

# #end it
# exit
df -h
date
