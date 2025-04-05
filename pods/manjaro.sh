#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
cd $CMD_PATH

IMAGE="manjarolinux/base:latest"
source podman.command.sh arch
