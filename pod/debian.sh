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
rm ../ci/$TARBALLS
cp ../dist/$TARBALLS ../ci/

# define YOLK if Debian
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "debian" ]]; then
        DEST="/var/local/yolk"
        if [ ! -d $DEST ]; then
            sudo mkdir -p $DEST
            YOLK="-v $DEST:$DEST"
        fi
    fi

    sudo podman run \
            --hostname minimal \
            --privileged \
            --ulimit nofile=32000:32000 \
            --pull=always \
            --userns=host \
            -it \
            -v $PWD/ci:/ci \
            -v /dev:/dev \
            $YOLK \
            debian \
            bash
fi

# interactive session

# This will be executed at end
cd $CMD_PATH
which podman 
podman --version
df -h
date

