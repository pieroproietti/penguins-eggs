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
rm ./ci/$TARBALLS
cp ../dist/$TARBALLS ./ci/

podman run --name container_arch \
            --hostname minimal \
            --privileged \
            --ulimit nofile=32000:32000 \
            --pull=always \
            -it \
            -v $PWD/pod/ci:/ci \
            -v /dev:/dev \
            archlinux \
            bash

cd $CMD_PATH
which podman 
podman --version
df -h
date
# interactive commands 

