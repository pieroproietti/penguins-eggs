# /percorso/sorgenti/modules.d/95luks-loop/module-setup.sh

#!/bin/bash

# CORRETTO: La funzione check() viene eseguita al momento della creazione.
# Deve solo verificare se il modulo è installabile, non controllare i parametri del kernel.
# return 0 significa "sì, questo modulo è disponibile per l'uso".
check() {
    return 0
}

# Definisce le dipendenze, questo è corretto.
depends() {
    echo "dmsquash-live crypt"
}

# Questa funzione viene eseguita al momento dell'avvio (runtime) ed è il posto giusto per getarg.
cmdline() {
    [[ $(getarg rd.luks.loop) ]] || return

    printf 'root="block:/dev/mapper/crypted"\n'
    # !! Sostituisci 'ext4' se usi un altro filesystem !!
    printf 'rootfstype="ext4"\n'
}

# Installa lo script hook e i comandi necessari. Questo è corretto.
install() {
    inst_multiple losetup cryptsetup blkid
    inst_hook pre-mount 50 "$moddir/luks-loop.sh"
}
