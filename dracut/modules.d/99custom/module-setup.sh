#!/bin/bash

check() {
    return 0
}

depends() {
    return 0
}

install() {
    inst_hook pre-mount 50 "$moddir/custom-mount.sh"
}
