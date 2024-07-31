#!/bin/bash

check() {
    return 0
}

depends() {
    echo "shutdown"
    return 0
}

install() {
    inst_hook cmdline 90 "$moddir/mount-live.sh"
    inst_hook pre-mount 50 "$moddir/init-live.sh"
}
