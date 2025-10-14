#!/bin/bash

check() {
    return 0
}

depends() {
    # Nessuna dipendenza esplicita
    # Funziona senza dipendere da altri moduli
    return 0
}

install() {
    inst_multiple cryptsetup losetup blkid findfs mount umount udevadm
    inst_hook pre-mount 40 "$moddir/luks.sh"
}
