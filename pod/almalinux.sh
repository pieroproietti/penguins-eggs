#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
cd $CMD_PATH

IMAGE=almalinux
source podman.command.sh
