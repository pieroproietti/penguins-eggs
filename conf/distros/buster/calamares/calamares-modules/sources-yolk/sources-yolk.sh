#!/bin/bash

#
# sources-yolk
# utilizza solo la repository yolk durante l'installazione.
# 
# sources-yolk -u
# rimuove yolk e reimposta le apt-list originali

function main {
    #####################################################################
    # unmount: remove yolk.list
    #####################################################################
    if [ "$1" = "-u" ]; then
        restore_apt
    else
        backup_apt
        yolk
    fi
}


##############################
# * cancella backup
# * crea dir backop
# ° mv sources.list in backup
# ° mv sources.list.d in backup
##############################
function backup_apt {
    if [ -d "$APT_BACKUP" ]; then
        rm "$APT_BACKUP" -rf
    fi
    mkdir "$APT_BACKUP" -p

    if [ -f "$APT_ROOT/sources.list" ]; then
        mv "$APT_ROOT/sources.list" "$APT_BACKUP"
    else
        restore_apt
    fi
    mv "$APT_ROOT/sources.list.d/" "$APT_BACKUP"
}

##############################
# * cancella sources.list in apt
# * cancella sources.list.d in apt
# ° mv sources.list in apt
# ° mv sources.list.d in apt
##############################
function restore_apt {
    if [ -f "$APT_ROOT/sources.list" ]; then
        rm "$APT_ROOT/sources.list"
    fi
    if [ -d "$APT_ROOT/sources.list.d" ]; then
        rm "$APT_ROOT/sources.list.d" -rf
    fi

    mv "$APT_BACKUP/sources.list" "$APT_ROOT"
    mv "$APT_BACKUP/sources.list.d/" "$APT_ROOT"
}

##############################
# se non esiste crea sources.list.d
# crea sources.list.d/yolk.list
# esegue update
##############################
function yolk {
    mkdir "$APT_ROOT/sources.list.d"
cat << EOF > "$CHROOT/etc/apt/sources.list.d/yolk.list"
deb [trusted=yes] file:///var/local/yolk ./
EOF
chroot "${CHROOT}" apt-get --allow-unauthenticated update -y
}

# Lo script inizia qui
# attenzione agli spazi, controllare tutto
# CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

APT_ROOT="${CHROOT}/etc/apt"
APT_BACKUP="/tmp/calamares-krill-temp"
# clear
echo "APT_ROOT: $APT_ROOT"
echo "APT_BACKUP: $APT_BACKUP"

main "$1"
exit 0
