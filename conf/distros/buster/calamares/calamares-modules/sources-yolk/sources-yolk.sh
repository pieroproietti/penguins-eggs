#!/bin/bash

#
# We use just yolk during installation
#
# sources-yolk.sh
# add yolk, rimuove sourceslist, sourceslist.d ed esegue apt non autenticato
#
# sources-yolk.sh -u
# remove yolk, restore sourceslist, sourceslist.d ed esegue apt non autenticato

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
function backup {
    if [ -f "$SOURCESLIST_BACKUP" ]; then
        rm -f "$SOURCESLIST_BACKUP"
    fi
    mv "$SOURCESLIST" "$SOURCESLIST_BACKUP"

    if [ -d "$SOURCESLIST_D_BACKUP" ]; then
        rm -rf "$SOURCESLIST_D_BACKUP"
    fi
    mv "$SOURCESLIST_D" "$SOURCESLIST_D_BACKUP"
}

function restore {
    if [ -f "$SOURCESLIST" ]; then
        rm -f "$SOURCESLIST" 
    fi
    mv "$SOURCESLIST_BACKUP" "$SOURCESLIST"

    if [ -d "$SOURCESLIST_D" ]; then
        rm -rf "$SOURCESLIST_D" 
    fi        
    mv "$SOURCESLIST_D_BACKUP" "$SOURCESLIST_D"
}


function add_yolk {
    backup

cat << 'EOF' >> $CHROOT/etc/apt/sources.list.d/yolk.list
# yolk repo
deb [trusted=yes] file:/var/local/yolk ./
EOF

    chroot $CHROOT apt-get --allow-unauthenticated update -y
}

function remove_yolk {
    restore
    chroot $CHROOT apt-get update -y
}



# Lo script inizia qui
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

SOURCESLIST="$CHROOT/etc/apt/sources.list"
SOURCESLIST_BACKUP="$SOURCESLIST.backup"

SOURCESLIST_D="$CHROOT/etc/apt/sources.list.d"
SOURCESLIST_D_BACKUP="$SOURCESLIST_D.backup"

main $1
exit 0