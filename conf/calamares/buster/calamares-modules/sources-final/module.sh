#!/bin/sh
#
# Writes the final sources.list file
#

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
RELEASE="buster"

cat << EOF > $CHROOT/etc/apt/sources.list
# See https://wiki.debian.org/SourcesList for more information.
deb http://deb.debian.org/debian $RELEASE main
deb-src http://deb.debian.org/debian $RELEASE main

deb http://deb.debian.org/debian $RELEASE-updates main
deb-src http://deb.debian.org/debian $RELEASE-updates main

deb http://security.debian.org/debian-security/ $RELEASE/updates main
deb-src http://security.debian.org/debian-security/ $RELEASE/updates main
EOF

#####################################################################
rm $CHROOT/etc/apt/sources.list
rm $CHROOT/etc/apt/sources.list.d -rf
mv $CHROOT/etc/apt/sources.list-backup $CHROOT/etc/apt/sources.list
mv $CHROOT/etc/apt/sources.list.d-backup $CHROOT/etc/apt/sources.list.d
#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^#
exit 0
