#!/usr/bin/env bash
set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export TERM=xterm-256color
cd $CMD_PATH
env
if [ ! -z $JOB_BASE_NAME ];then
    echo $JOB_BASE_NAME

    name1=$(echo $JOB_BASE_NAME | cut -d "." -f1)
    name2=$(echo $JOB_BASE_NAME | cut -d "." -f2)
    export GITHUB_REPOSITORY="openos365/$name1"
    export GITHUB_REF_NAME="$name2"
    export GITHUB_RUN_NUMBER=$BUILD_NUMBER
fi

sudo apt install -y expect
./2.ci.expect.sh
