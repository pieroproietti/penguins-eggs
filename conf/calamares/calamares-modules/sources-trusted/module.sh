#!/bin/sh
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
RELEASE="buster"

if [ "$1" = "-u" ]; then
    rm $CHROOT/etc/apt/sources.list.d/debian-trusted.list
    chroot $CHROOT apt-get --allow-unauthenticated update
    exit 0
fi

# Remove previous sources, we will configure sources in a later phase
#####################################################################
rm $CHROOT/etc/apt/sources.list-backup
rm $CHROOT/etc/apt/sources.list.d-backup -rf
mv $CHROOT/etc/apt/sources.list $CHROOT/etc/apt/sources.list-backup
mv $CHROOT/etc/apt/sources.list.d $CHROOT/etc/apt/sources.list.d-backup
#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^#
mkdir -p $CHROOT/etc/apt/sources.list.d
#
# Writes the debian-trusted.list file

cat << EOF > $CHROOT/etc/apt/sources.list.d/debian-trusted.list
# See https://wiki.debian.org/SourcesList for more information.
# debian-trusted.list >>> That list is only for installation<<<
deb [trusted=yes] http://deb.debian.org/debian $RELEASE main
deb-src [trusted=yes] http://deb.debian.org/debian $RELEASE main

deb [trusted=yes] http://deb.debian.org/debian $RELEASE-updates main
deb-src [trusted=yes] http://deb.debian.org/debian $RELEASE-updates main

deb [trusted=yes] http://security.debian.org/debian-security/ $RELEASE/updates main
deb-src [trusted=yes] http://security.debian.org/debian-security/ $RELEASE/updates main
EOF

chroot $CHROOT apt-get --allow-unauthenticated update -y
exit 0
