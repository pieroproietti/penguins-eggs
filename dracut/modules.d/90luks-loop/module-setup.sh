#!/bin/bash
# ===========================================================
# Dracut module: luks-loop
# Autore: Piero Proietti (colibri)
# Scopo: montare un file LUKS (es. /live/luks.img) come loop
# ===========================================================

check() {
    # Questo modulo è sempre applicabile
    return 0
}

depends() {
    # Dipende dai moduli dracut standard che forniscono cryptsetup e iso-scan
    echo "crypt iso-scan"
    return 0
}

install() {
    # Installa lo script principale all’avvio di Dracut (fase cmdline)
    inst_hook cmdline 30 "$moddir/luks-loop.sh"

    # Installa gli strumenti necessari nel initramfs
    inst_multiple cryptsetup losetup blkid grep cut mount umount cat
}
