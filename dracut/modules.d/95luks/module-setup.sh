#!/bin/bash
# 95luks module-setup for Penguins-Eggs (Debian Trixie compatible)

check() {
    return 0
}

# Non richiediamo "90luks" (non presente su Debian)
# Dipendiamo da moduli realmente presenti: rootfs-block e crypt (se esistono)
depends() {
    [ -d /usr/lib/dracut/modules.d/95rootfs-block ] && echo "rootfs-block"
    [ -d /usr/lib/dracut/modules.d/90crypt ] && echo "crypt"
    # se esiste crypt-loop lo includiamo come possibile dipendenza
    [ -d /usr/lib/dracut/modules.d/91crypt-loop ] && echo "crypt-loop"
    return 0
}

install() {
    # strumenti necessari
    inst_multiple cryptsetup losetup blkid findfs mount umount udevadm

    # Hook eseguito prima che root venga montato
    # priorità 40: dopo iso-scan (se presente) e prima di dmsquash-live
    inst_hook pre-mount 40 "$moddir/luks.sh"
}
