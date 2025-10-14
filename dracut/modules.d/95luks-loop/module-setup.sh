#!/bin/bash

check() {
    return 0
}

depends() {
    # Dipende solo da dmsquash-live (che esiste sicuramente)
    echo "dmsquash-live"
    return 0
}

cmdline() {
    [[ $(getarg rd.luks.loop) ]] || return
    printf 'root="block:/dev/mapper/crypted"\n'
    printf 'rootfstype="ext4"\n'
}

install() {
    inst_multiple losetup cryptsetup blkid
    inst_hook pre-mount 50 "$moddir/luks-loop.sh"
}
