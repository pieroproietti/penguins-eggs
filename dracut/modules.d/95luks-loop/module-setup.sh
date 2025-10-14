#!/bin/bash

check() { return 0; }

depends() { echo "rootfs-block crypt luks"; }

install() {
    inst_multiple losetup cryptsetup blkid mount
    inst_hook pre-mount 50 "$moddir/luks-loop.sh"
}
