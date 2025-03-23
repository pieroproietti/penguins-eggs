#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
export NEEDRESTART_MODE=a


####################################################################################################################################
cd $CMD_PATH
git clone https://github.com/pieroproietti/penguins-eggs /tmp/penguins-eggs
cd /tmp/penguins-eggs
npm install pnpm -g
pnpm install
pnpm tarballs
cp /tmp/penguins-eggs/dist/eggs-v10.0.60-*-linux-x64.tar.gz /ci
cd $CMD_PATH
