#!/usr/bin/env bash

set -x

# remove previous images
podman rmi $(podman images --quiet) -f

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
echo $PROJECT_NAME
cd $CMD_PATH

source ci/penguins-eggs-tarballs-replace.sh

sudo podman run \
        --hostname minimal \
        --privileged \
        --ulimit nofile=32000:32000 \
        --pull=always \
        --userns=host \
        -it \
        --rm \
        -v $PWD/ci:/ci \
        -v /dev:/dev \
        archlinux \
        bash

# interactive session

# This will be executed at end
cd $CMD_PATH
which podman 
podman --version
df -h
date

