#!/usr/bin/env bash

set -x

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
echo $PROJECT_NAME
cd $CMD_PATH

source ci/penguins-eggs-tarballs-replace.sh

IMAGE="openmamba/openmamba:latest"
source podman.command.sh
