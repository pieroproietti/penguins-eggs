#!/bin/bash

#
# Questa versione utilizza SOLO yolk 
# durante l'installazione.
# sources-yolk.sh
#    aggiunge yolk, rimuove list ed esegue apt non autenticato
# sources-yolk.sh
# -u rimuove yolk e ri-aggiunge le list

function main {
    #####################################################################
    # unmount: remove yolk.list
    #####################################################################
    if [ "$1" = "-u" ]; then
        remove_yolk
    else
        add_yolk
    fi
}


#####################################################################
function remove_list {
    if [ -f "$LIST_BACKUP" ]; then
        rm "$LIST_BACKUP"
    fi
    mv "$LIST $LIST_BACKUP"

    if [ -d "$LIST_D_BACKUP" ]; then
        rm "$LIST_D_BACKUP" -rf
    fi
    mv "$LIST_D $APT_LIST_D_BACKUP"
}

function add_list {
    if [ -f "$LIST" ]; then
        rm "$LIST" 
    fi
    mv "$APT_LIST_BACKUP $LIST"

    if [ -d "$LIST_D" ]; then
        rm "$LIST_D" -rf
    fi        
    mv "$LIST_D_BACKUP $LIST_D"
}


function add_yolk {
    remove_list
    cat << EOF > $CHROOT/etc/apt/sources.list.d/yolk.list
    deb [trusted=yes] file:/var/local/yolk ./
EOF
    chroot $CHROOT apt-get --allow-unauthenticated update -y
}

function remove_yolk {
    add_list
    rm $CHROOT/etc/apt/sources.list.d/yolk.list
    chroot $CHROOT apt-get update -y
}



# Lo script inizia qui
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

LIST = "$CHROOT/etc/apt/sources.list"
LIST_BACKUP = "$LIST.backup"

LIST_D = "$CHROOT/etc/apt/sources.list.d"
LIST_D_BACKUP = "$LIST_D.backup"

main $1
exit 0
