#!/bin/bash

# sources-yolk
#
# utilizza solo la repository yolk durante l'installazione.
# 
# sources-yolk -u
# rimuove yolk e reimposta le apt-list originali

function main {
    #####################################################################
    # unmount: remove yolk.list
    #####################################################################
    if [ "$1" = "-u" ]; then
        backup2original
        yolk_list_remove
    else
        original2backup
        yolk_list_create
    fi
}


#####################################################################
function original2backup {
    if [ -d "$APT_BACKUP" ]; then
        rm $APT_BACKUP -rf
    fi
    mkdir $APT_BACKUP -p

    mv $APT_ROOT/$SOURCES_LIST $APT_BACKUP
    mv $APT_ROOT/$SOURCES_LIST_D/ $APT_BACKUP
}

function backup2original {
    if [ -f "$APT_ROOT/$SOURCES_LIST" ]; then
        rm $APT_ROOT/$SOURCES_LIST
    fi
    if [ -d "$APT_ROOT/$SOURCES_LIST_D" ]; then
        rm $APT_ROOT/$SOURCES_LIST_D -rf
    fi

    mv $APT_BACKUP/$SOURCES_LIST $APT_ROOT
    mv $APT_BACKUP/$SOURCES_LIST_D/ $APT_ROOT
}




function yolk_list_create {
    mkdir $CHROOT/etc/apt/sources.list.d/
    cat << EOF > $CHROOT/etc/apt/sources.list.d/yolk.list
    deb [trusted=yes] file:/usr/local/yolk ./
EOF
    "chroot ${CHROOT} apt-get --allow-unauthenticated update -y"
}

function yolk_list_remove {
    rm $CHROOT/etc/apt/sources.list.d/yolk.list
    #chroot $CHROOT apt-get update -y
}



# Lo script inizia qui
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

APT_ROOT="${CHROOT}/etc/apt"
APT_BACKUP="/tmp/calamares-krill-temp"

SOURCES_LIST="sources.list"
SOURCES_LIST_D="sources.list.d"
clear
echo "sources.list: $SOURCES_LIST"
echo "sources.list.d: $SOURCES_LIST_D"
echo "APT_BACKUP: $APT_BACKUP"
echo ""
main $1
exit 0
