#!/bin/bash

check() {
    return 0
}

depends() {
    echo "rootfs-block"
    return 0
}

install() {
    inst_multiple mount umount blkid
    inst_hook cmdline 10 "$moddir/block-cmdline.sh"
}
