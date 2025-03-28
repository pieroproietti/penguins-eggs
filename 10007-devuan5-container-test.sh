#!/usr/bin/env bash

set -x
source ./10000-ubuntu-container-base.sh

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
        devuan/devuan:daedalus \
        /ci/run-on-devuan.sh
        
df -h
date
