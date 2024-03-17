#!/bin/sh

#
# We use just yolk during installation
#
# sources-yolk.sh
# add yolk, rimuove LIST, LIST.d ed esegue apt non autenticato
#
# sources-yolk.sh -u
# remove yolk, restore LIST, LIST.d ed esegue apt non autenticato

#
#
#
main() {
    if [ "$1" = "-u" ]; then
        restore
    else
        backup
        yolk
    fi
    sync
    exit 0
}

#
#
#
backup() {
    if [ -f "$BACKUP" ]; then
        rm -f "$BACKUP"
    fi

    if [ -d "$BACKUP_D" ]; then
        rm -rf "$BACKUP_D"
    fi

    mv "$LIST" "$BACKUP"

    mv "$LIST_D" "$BACKUP_D"
}

#
#
#
restore() {
    if [ -f "$LIST" ]; then
        rm -f "$LIST"
    fi

    if [ -d "$LIST_D" ]; then
        rm -rf "$LIST_D"
    fi

    mv "$BACKUP" "$LIST"

    mv "$BACKUP_D" "$LIST_D"
}

#
#
#
yolk() {
    mkdir -p "$LIST_D"
    echo "deb [trusted=yes] file:/var/local/yolk ./" > "$LIST_D/yolk.list"
    touch "$LIST"
    chroot "$CHROOT" apt-get --yes update
}

#
# WE START HERE
#
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

LIST="$CHROOT/etc/apt/sources.list"
BACKUP="$LIST.backup"

LIST_D="$LIST.d"
BACKUP_D="$LIST_D.backup"

main "$1"

