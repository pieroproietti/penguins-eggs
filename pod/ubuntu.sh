#!/usr/bin/env bash

set -x

# remove previous images
podman rmi $(podman images --quiet) -f

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
echo $PROJECT_NAME
cd $CMD_PATH

source ci/penguins-eggs-tarballs-replace.sh

if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "ubuntu" ]]; then
        DEST="/var/local/yolk"
        if [ ! -d $DEST ]; then
            sudo mkdir -p $DEST
            YOLK="-v $DEST:$DEST"
        fi
    fi
fi

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
        $YOLK \
        ubuntu \
        bash



# interactive session

# This will be executed at end
cd $CMD_PATH
which podman 
podman --version
df -h
date

