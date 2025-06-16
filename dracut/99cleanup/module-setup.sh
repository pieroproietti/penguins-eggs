#!/bin/bash

# Script per il modulo dracut '99-cleanup'

# check() viene chiamato per vedere se il modulo deve essere incluso.
# Restituendo 0 lo includiamo sempre.
check() {
    return 0
}

# depends() definisce le dipendenze. Non ne abbiamo.
depends() {
    return 0
}

# install() è il cuore del nostro modulo.
# Viene eseguito durante la creazione dell'initramfs.
install() {
    # La variabile $dracut_tmp_dir punta alla directory temporanea
    # dove dracut sta assemblando i file dell'initramfs.
    
    instlog "Running 99-cleanup: Removing host-specific device hooks."

    # Rimuoviamo chirurgicamente i file "hook" problematici che
    # cercano un UUID specifico. Usiamo i wildcard (*) per
    # intercettarli indipendentemente dal nome esatto.
    rm -f "${dracut_tmp_dir}/var/lib/dracut/hooks/emergency/80-"*
    rm -f "${dracut_tmp_dir}/var/lib/dracut/hooks/initqueue/finished/devexists-"*
}
