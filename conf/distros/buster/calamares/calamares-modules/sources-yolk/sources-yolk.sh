#!/bin/sh
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
RELEASE="{{versionId}}"

#####################################################################
# Unmount delle sources-yolk
#####################################################################
if [ "$1" = "-u" ]; then
    rm $CHROOT/etc/apt/sources.list.d/debian-yolk.list
    chroot $CHROOT apt-get --allow-unauthenticated update
    exit 0
fi


#####################################################################
# Save previous sources, we will restore them in a later phase
#####################################################################
rm $CHROOT/etc/apt/sources.list-backup
rm $CHROOT/etc/apt/sources.list.d-backup -rf
mv $CHROOT/etc/apt/sources.list $CHROOT/etc/apt/sources.list-backup
mv $CHROOT/etc/apt/sources.list.d $CHROOT/etc/apt/sources.list.d-backup
#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^#
# Create a new /etc/apt/sources.list.d
mkdir -p $CHROOT/etc/apt/sources.list.d
#
# Writes the debian-trusted.list file
#
cat << EOF > $CHROOT/etc/apt/sources.list.d/debian-yolk.list
deb [trusted=yes] file:/run/live/medium/yolk ./
EOF

chroot $CHROOT apt-get --allow-unauthenticated update -y
exit 0
