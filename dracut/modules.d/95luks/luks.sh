#!/bin/sh
# 95luks: open a LUKS image file found on the live medium and export /dev/mapper/luks_root
# Compatible with Debian Trixie (no 90luks assumed)

type info >/dev/null 2>&1 || info() { echo "[95luks] $*" >&2; }
type warn >/dev/null 2>&1 || warn() { echo "[95luks][WARN] $*" >&2; }
type die >/dev/null 2>&1 || die() { echo "[95luks][ERR] $*" >&2; exit 1; }

# Read kernel args
luks_loop=$(getarg rd.luks.loop=)
luks_uuid=$(getarg rd.luks.uuid=)
# fallback path written by iso-scan (if present)
if [ -z "$luks_loop" ] && [ -e /run/initramfs/luks.loop.path ]; then
    luks_loop=$(cat /run/initramfs/luks.loop.path)
fi

# Nothing to do
[ -z "$luks_loop" ] && info "no rd.luks.loop or fallback path found — skipping 95luks" && exit 0

info "found luks image path: $luks_loop"

# If the path is on the mounted iso (e.g. /run/initramfs/isoscan/live/luks.img) use it directly,
# otherwise if it's a path on a block device we must losetup it.
if [ -b "$luks_loop" ]; then
    # it's a block device already
    loopdev="$luks_loop"
else
    # if the given path is inside the iso mount (e.g. /run/initramfs/isoscan/live/luks.img),
    # we can use losetup on the file.
    if [ -f "$luks_loop" ]; then
        info "setting up loop device for $luks_loop"
        loopdev=$(losetup --show -f "$luks_loop") || die "losetup failed"
    else
        warn "luks image path $luks_loop not found"
        exit 0
    fi
fi

# wait for udev to settle so /dev/loopX is available
udevadm settle

# Optionally verify UUID (cryptsetup luksUUID works on file too)
if [ -n "$luks_uuid" ]; then
    detected_uuid=$(cryptsetup luksUUID "$loopdev" 2>/dev/null || true)
    if [ -n "$detected_uuid" ] && [ "$detected_uuid" != "$luks_uuid" ]; then
        warn "LUKS UUID mismatch: expected $luks_uuid, found $detected_uuid"
    fi
fi

# Try to open the LUKS container. If /run/initramfs/live.key exists use it.
KEYFILE="/run/initramfs/live.key"
if [ -f "$KEYFILE" ]; then
    info "opening luks with keyfile $KEYFILE"
    cryptsetup open "$loopdev" luks_root --key-file "$KEYFILE" || die "cryptsetup open failed"
else
    info "opening luks (will prompt for passphrase if interactive)"
    # cryptsetup in initramfs may prompt; allow it but don't block with die here
    if ! cryptsetup open "$loopdev" luks_root; then
        warn "cryptsetup open failed or passphrase not provided"
        # cleanup loop if we created one
        if [ -n "$luks_loop" ] && [ -f "$luks_loop" ]; then
            losetup -d "$loopdev" 2>/dev/null || true
        fi
        exit 1
    fi
fi

# Export the mapped device as rootdev for rootfs-block to pick it up
echo "/dev/mapper/luks_root" > /run/initramfs/rootdev
info "exported /dev/mapper/luks_root as /run/initramfs/rootdev"

# also expose a flag that we opened LUKS (optional)
touch /run/initramfs/luks-opened

