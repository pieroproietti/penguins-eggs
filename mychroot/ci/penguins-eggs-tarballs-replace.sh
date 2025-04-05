#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME

# replace tarballs in ci
PENGUINS_EGGS_TARBALLS=penguins-eggs_10.1.*-*-linux-x64.tar.gz
rm $CMD_PATH/../ci/$PENGUINS_EGGS_TARBALLS
cp $CMD_PATH/../dist/$PENGUINS_EGGS_TARBALLS ./ci/
