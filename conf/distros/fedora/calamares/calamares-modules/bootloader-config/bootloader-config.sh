#!/bin/bash

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

echo "this is a dummy for fedora"
