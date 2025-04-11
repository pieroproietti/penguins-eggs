#!/usr/bin/env bash

set -x

function arch_package {
    if ls $CMD_PATH/../../penguins-packs/aur/penguins-eggs/$PENGUINS_EGGS_ARCH 1> /dev/null 2>&1; then
        echo "penguins-eggs ARCH present"
    fi
    cp $CMD_PATH//../../penguins-packs/aur/penguins-eggs/$PENGUINS_EGGS_ARCH $CMD_PATH/./ci/
}

function tarballs {
    if ls $CMD_PATH/../dist/$PENGUINS_EGGS_TARBALLS 1> /dev/null 2>&1; then
        echo "penguins-eggs TARBALLS present"
    else
        pnpm tarballs

    fi
    cp $CMD_PATH/../dist/$PENGUINS_EGGS_TARBALLS $CMD_PATH/./ci/
}


function debs {
    if ls $CMD_PATH/../dist/$PENGUINS_EGGS_DEB 1> /dev/null 2>&1; then
        echo "penguins-eggs DEB present"
    else 
        pnpm deb
    fi
    cp $CMD_PATH/../dist/$PENGUINS_EGGS_DEB  $CMD_PATH/./ci/
}


##
#
# main
#podman rmi $(podman images --quiet) -f

* Remove ARCH, DEBS and tarballs in ci
PENGUINS_EGGS_ARCH="penguins-eggs-10.1.*-*-any.pkg.tar.zst "
PENGUINS_EGGS_DEB="penguins-eggs_10.1.*-*_amd64.deb"
PENGUINS_EGGS_TARBALLS=penguins-eggs_10.1.*-*-linux-x64.tar.gz

# rm -f $CMD_PATH/./ci/$PENGUINS_EGGS_ARCH
# rm -f $CMD_PATH/./ci/$PENGUINS_EGGS_DEB
# rm -f $CMD_PATH/./ci/$PENGUINS_EGGS_TARBALLS

if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "debian" ]]; then
        if [[ $FAMILY_ID == "debian" ]]; then
            debs
        else
            tarballs
        fi
    elif [[ "$ID" == "arch" ]]; then
        if [[ $FAMILY_ID == "arch" ]]; then
            arch_package
        else 
            tarballs
        fi
    else
        tarballs
    fi
fi

echo "FAMILY_ID: $FAMILY_ID"

podman run \
    --name current \
    --env FAMILY_ID="$FAMILY_ID" \
    --hostname minimal \
    --privileged \
    --cap-add=CAP_SYS_ADMIN \
    --ulimit nofile=32000:32000 \
    --pull=always \
    --rm \
    -it \
    -v ./ci:/ci \
    $YOLK \
    $IMAGE \
    /ci/run

