#!/bin/sh
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
#####################################################################
# unmount: remove yolk.list
#####################################################################
if [ "$1" = "-u" ]; then
    rm $CHROOT/etc/apt/sources.list.d/yolk.list
    chroot $CHROOT apt-get --allow-unauthenticated update
    exit 0
fi

#####################################################################
# add yolk.list
#####################################################################
cat << EOF > $CHROOT/etc/apt/sources.list.d/yolk.list
deb [trusted=yes] file:/usr/local/yolk ./
EOF
chroot $CHROOT apt-get --allow-unauthenticated update -y
exit 0
