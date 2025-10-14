#!/bin/bash

luks_loop=$(getarg rd.luks.loop=)
luks_uuid=$(getarg rd.luks.uuid=)

if [ -z "$luks_loop" ] && [ -e /run/initramfs/luks.loop.path ]; then
    luks_loop=$(cat /run/initramfs/luks.loop.path)
fi

if [ -n "$luks_loop" ]; then
    info "dracut: opening LUKS image $luks_loop (UUID=$luks_uuid)"

    luksdev=$(losetup --show -f "$luks_loop") || die "cannot setup loop"
    cryptsetup open "$luksdev" luks_root --key-file /run/initramfs/luks.key \
        || die "cannot open luks image"

    rootdev="/dev/mapper/luks_root"
    mount "$rootdev" "$NEWROOT" -o ro || die "cannot mount root"
fi

