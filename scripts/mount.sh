#!/bin/sh
# parameter: $1 partition root
# parameter: $2 partition boot
# parameter: $3 partition data
mkdir /TARGET/
sleep 1
mount $1 /TARGET
mkdir -p /TARGET/boot
mkdir -p /TARGET/var/lib/vz
mount $2 /TARGET/boot
mount $3 /TARGET/var/lib/vz
