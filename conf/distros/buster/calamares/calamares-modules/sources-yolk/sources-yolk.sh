#!/bin/bash

#
# sources-yolk
# utilizza solo la repository yolk durante l'installazione.
# 
# sources-yolk -u
# rimuove yolk e reimposta le apt-list originali


##############################
# function main {
##############################
function main {
    # if u = unmount restore_apt
    if [ "$1" = "-u" ]; then
        clean_apt
        restore_apt
    else
        # backup_apt, yolk
        clean_backup
        backup_apt

        clean_apt
        yolk
    fi
}



##############################
# function backup_apt
##############################
function backup_apt {
    mkdir "$APT_BACKUP" -p
    if [ -f "$APT_ROOT/sources.list" ]; then
        mv "$APT_ROOT/sources.list" "$APT_BACKUP"
    fi
    if [ -d "$APT_ROOT/sources.list.d" ]; then
        mv "$APT_ROOT/sources.list.d/" "$APT_BACKUP"
    fi
}



##############################
# function restore_apt
##############################
function restore_apt {
    mv "$APT_BACKUP/sources.list" "$APT_ROOT"
    mv "$APT_BACKUP/sources.list.d/" "$APT_ROOT"
}



##############################
# function: clean_apt
##############################
function clean_apt {
    if [ -f "$APT_ROOT/sources.list" ]; then
        rm "$APT_ROOT/sources.list"
    fi
    if [ -d "$APT_ROOT/sources.list.d" ]; then
        rm "$APT_ROOT/sources.list.d" -rf
    fi
}


##############################
# function: clean_backup
##############################
function clean_backup {
    if [ -d "$APT_BACKUP" ]; then
        rm "$APT_BACKUP" -rf
    fi
}



##############################
# function yolk {
##############################
function yolk {

    mkdir "$APT_ROOT/sources.list.d"

cat << EOF > "$CHROOT/etc/apt/sources.list.d/yolk.list"
deb [trusted=yes] file:///var/local/yolk /
EOF

    # apt-get update
    chroot "${CHROOT}" apt-get --allow-unauthenticated update -y
}



##############################
# PROCESS START HERE!!!
# CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
##############################
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
APT_ROOT="${CHROOT}/etc/apt"
APT_BACKUP="/tmp/calamares-krill-temp"
main "$1"
exit 0
