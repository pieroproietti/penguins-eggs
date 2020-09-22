#!/bin/bash

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

# Creo la directory $CHROOT/tmp se mancante 
TMPDIR=$CHROOT/tmp
if [ ! -d $TMPDIR ]; then
    mkdir $TMPDIR
    chmod 1777 $TMPDIR -R
fi
