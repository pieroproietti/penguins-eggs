#!/usr/bin/env bash

set -x
# remove previous images
podman rmi $(podman images --quiet) -f

PENGUINS_EGGS_TARBALLS=penguins-eggs_10.0.60-*-linux-x64.tar.gz
rm $CMD_PATH/./ci.local/$PENGUINS_EGGS_TARBALLS

# Check presence of $PENGUINS_EGGS_TARBALLS in dist
if ls $CMD_PATH/../dist/$PENGUINS_EGGS_TARBALLS 1> /dev/null 2>&1; then
    echo "penguins-eggs tarballs present"
else
    echo "penguins-eggs tarballs building"
    pnpm tarballs --release 15
fi
# copy tarballs in ci.local
cp $CMD_PATH/../dist/$PENGUINS_EGGS_TARBALLS $CMD_PATH/./ci.local/

podman run \
    --hostname minimal \
    --privileged \
    --cap-add=CAP_SYS_ADMIN \
    --ulimit nofile=32000:32000 \
    --pull=always \
    --rm \
    -it \
    -v /dev:/dev \
    -v ./ci.local:/ci \
    $YOLK \
    $IMAGE \
    sh -c "/ci/run; exec bash"
