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
    if ls $CMD_PATH/../perrisbrewery/workdir/$PENGUINS_EGGS_DEB 1> /dev/null 2>&1; then
        echo "penguins-eggs DEB present"
    else 
        pnpm deb
    fi
    cp $CMD_PATH/../perrisbrewery/workdir/$PENGUINS_EGGS_DEB  $CMD_PATH/./ci/
}


##
#
# main
#podman rmi $(podman images --quiet) -f

* Remove ARCH, DEBS and tarballs in ci
PENGUINS_EGGS_ARCH="penguins-eggs-10.1.*-*-any.pkg.tar.zst "
rm -f $CMD_PATH/./ci/$PENGUINS_EGGS_ARCH

PENGUINS_EGGS_DEB="penguins-eggs_10.1.*-*_amd64.deb"
rm -f $CMD_PATH/./ci/$PENGUINS_EGGS_DEB

PENGUINS_EGGS_TARBALLS=penguins-eggs_10.1.*-*-linux-x64.tar.gz
rm -f $CMD_PATH/./ci/$PENGUINS_EGGS_TARBALLS

if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "debian" ]]; then
        if [[ $1 == "debian" ]]; then
            debs
        elif [[ $1 == "devuan" ]]; then
            debs
        elif [[ $1 == "ubuntu" ]]; then
            debs
        else
            tarballs
        fi
    elif [[ "$ID" == "arch" ]]; then
        if [[ $1 == "arch" ]]; then
            arch_package
        else 
            tarballs
        fi
    else
        tarballs
    fi
fi
echo "distro: $1"


podman run \
    --name current \
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

