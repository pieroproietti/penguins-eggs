#!/usr/bin/env bash

set -x

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
echo $PROJECT_NAME
cd $CMD_PATH

source ci/penguins-eggs-tarballs-replace.sh

# define YOLK if ubuntu
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "ubuntu" ]]; then
        DEST="/var/local/yolk"
        if [ ! -d $DEST ]; then
            sudo mkdir -p $DEST
        fi
        YOLK="-v $DEST:$DEST"
    fi
fi

podman run \
    --hostname minimal \
    --privileged \
    --cap-add all \
    --ulimit nofile=32000:32000 \
    --pull=always \
    --rm \
    -it \
    -v /dev:/dev \
    -v ../mychroot/ci:/ci \
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

