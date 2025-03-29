#!/usr/bin/env bash

set -x
source ./10000-ubuntu-ci-server.sh

cd $CMD_PATH
which podman 
podman --version
df -h

podman run \
        --hostname minimal \
        --privileged \
        --cap-add all \
        --ulimit nofile=32000:32000 \
        --pull=always \
        -v $PWD/mychroot/ci:/ci \
        -v /dev:/dev \
        ghcr.io/ultramarine-linux/ultramarine-minimal:x86_64-latest \
        /ci/run-on-ultramarine.sh
        
df -h
ls -al $PWD/mychroot/ci/iso/
# upload $PWD/mychroot/ci/iso/ to server or github
date
