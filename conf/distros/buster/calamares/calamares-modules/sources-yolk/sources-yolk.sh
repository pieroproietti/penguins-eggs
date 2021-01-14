#!/bin/sh

# rimuove list ed aggiungeyolk
# -u rimuove yolk e ri-aggiunge le list

function main {
    CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
    LIST = "$CHROOT/etc/apt/sources.list"
    LIST_BACKUP = "$LIST.backup"

    LIST_D = "$CHROOT/etc/apt/sources.list.d"
    LIST_D_BACKUP = "$LIST_D.backup"

    #####################################################################
    # unmount: remove yolk.list
    #####################################################################
    if [ "$1" = "-u" ]; then
        add_list
        remove_yolk()
        exit 0
    else
        remove_list()
        add_yolk()
    fi

    chroot $CHROOT apt-get --allow-unauthenticated update -y
    exit 0
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
    cat << EOF > $CHROOT/etc/apt/sources.list.d/yolk.list
    deb [trusted=yes] file:/usr/local/yolk ./
EOF
}

function remove_yolk {
    rm $CHROOT/etc/apt/sources.list.d/yolk.list
    chroot $CHROOT apt-get update -y
    exit 0
}

main()