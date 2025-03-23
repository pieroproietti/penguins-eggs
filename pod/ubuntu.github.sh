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

podman run --hostname minimal \
            --privileged \
            --ulimit nofile=32000:32000 \
            --pull=always \
            -v $PWD/mychroot/ci:/ci \
            -v /dev:/dev \
            ubuntu:minimal \
            /ci/2-ubuntu-test.sh

cd $CMD_PATH
which podman 
podman --version

