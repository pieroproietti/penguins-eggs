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
        openmamba/openmamba:latest \
        /ci/run-on-openmamba.sh
        
df -h
ls -al $PWD/mychroot/ci/iso/
# upload $PWD/mychroot/ci/iso/ to server or github
date
