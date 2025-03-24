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

if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "debian" ]]; then
        if [ ! -d "/var/local/yolk" ]; then
            sudo mkdir -p "/var/local/yolk"
        fi
        podman run --hostname minimal \
                    --privileged \
                    --ulimit nofile=32000:32000 \
                    --pull=always \
                    -it \
                    -v $PWD/ci:/ci \
                    -v /dev:/dev \
                    -v /var/local/yolk:/var/local/yolk \
                    debian:12.9 \
                    bash
    else
        podman run --hostname minimal \
                    --privileged \
                    --ulimit nofile=32000:32000 \
                    --pull=always \
                    -it \
                    -v $PWD/ci:/ci \
                    -v /dev:/dev \
                    debian:12.9 \
                    bash
    fi
fi

cd $CMD_PATH
which podman 
podman --version
df -h
date
# interactive commands 
