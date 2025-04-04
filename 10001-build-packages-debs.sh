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
        --cap-add=CAP_SYS_ADMIN \
        --ulimit nofile=32000:32000 \
        --pull=always \
        -v $PWD/mychroot/ci:/ci \
        -v /dev:/dev \
        debian:12.9 \
        /ci/run-build-package-debs.sh

df -h
ls -al $PWD/mychroot/ci/iso/
# upload $PWD/mychroot/ci/iso/ to server or github
date
