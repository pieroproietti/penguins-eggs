#!/bin/sh

#
# We use just yolk during installation
#
# sources-yolk.sh
# add yolk
#
# sources-yolk.sh -u
# remove yolk

#
#
#
main() {
    if [ "$1" = "-u" ]; then
        remove
    else
        add
    fi
    sync
    exit 0
}


#
#
#
remove() {
    if [ -f "$YOLK_LIST" ]; then
        rm -f "$YOLK_LIST"
    fi
}

#
#
#
add() {
    echo "deb [trusted=yes] file:/var/local/yolk ./" > "$YOLK_LIST"
    chroot "$CHROOT" apt-get --yes update
}

#
# WE START HERE
#
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
YOLK_LIST="$CHROOT/etc/apt/sources.list.d/yolk.list"

main "$1"

