#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
cd $CMD_PATH
npm install -g pnpm@latest-10
pnpm install
pnpm deb --all

mv ./perrisbrewery/workdir/penguins-eggs_*_amd64.deb ./mychroot/ci/

cd $CMD_PATH
which podman 
podman --version
df -h
podman build \
--no-cache \
--pull=always \
--build-arg GITHUB_REF_NAME=$GITHUB_REF_NAME \
--build-arg GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
--build-arg GITHUB_RUN_NUMBER=$GITHUB_RUN_NUMBER \
--tag ${GITHUB_REF_NAME}-${GITHUB_RUN_NUMBER} \
--tag ${GITHUB_REF_NAME}-latest .

podman images
df -h
date
