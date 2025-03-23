#!/usr/bin/env bash

set -x

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
echo $PROJECT_NAME
cd $CMD_PATH


podman run --hostname minimal \
            --privileged \
            --ulimit nofile=32000:32000 \
            --pull=always \
            -v $PWD/mychroot/ci:/ci \
            -v /dev:/dev \
            ubuntu:latest \
            bash            

cd $CMD_PATH

# build tarballs
npm install -g pnpm
pnpm i
pnpm tarballs
/ci/2-ubuntu-test.github.sh
which podman 
podman --version

