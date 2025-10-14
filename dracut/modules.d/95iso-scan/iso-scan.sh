#!/bin/bash

# Penguins-Eggs: ISO scanner for Debian Dracut
# Compatible replacement for Fedora's 90iso-scan

info "dracut: running iso-scan replacement"

# Retrieve kernel args
live_label=$(getarg live:LABEL=)
live_media=$(getarg rd.live.media=)
live_dir=$(getarg rd.live.dir=/live)
luks_loop=$(getarg rd.luks.loop=)
squashimg=$(getarg rd.live.squashimg=filesystem.squashfs)

mountpoint="/run/initramfs/isoscan"

mkdir -p "$mountpoint"

# Detect ISO device: try LABEL or cdrom
if [ -n "$live_label" ]; then
    device=$(findfs "LABEL=$live_label")
elif [ -n "$live_media" ]; then
    device="$live_media"
else
    # fallback: try /dev/sr0 or /dev/loop0
    for dev in /dev/sr0 /dev/loop*; do
        [ -b "$dev" ] && device="$dev" && break
    done
fi

if [ -z "$device" ]; then
    warn "iso-scan: no live device found"
    exit 0
fi

info "iso-scan: found live device $device"

mount -o ro "$device" "$mountpoint" || die "Cannot mount live media"

# If luks.img exists, record its path for luks-loop
if [ -e "$mountpoint/live/luks.img" ]; then
    echo "$mountpoint/live/luks.img" > /run/initramfs/luks.loop.path
    info "iso-scan: found luks.img"
fi

# If filesystem.squashfs exists, export its path for dmsquash-live
if [ -e "$mountpoint/live/$squashimg" ]; then
    echo "$mountpoint/live/$squashimg" > /run/initramfs/live.squashfs.path
    info "iso-scan: found $squashimg"
fi
