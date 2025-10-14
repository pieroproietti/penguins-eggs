#!/bin/sh
# ===========================================================
# luks-loop.sh — Hook Dracut per montare /live/luks.img
# ===========================================================

type info >/dev/null 2>&1 || info() { echo "[luks-loop] $*" >&2; }
type warn >/dev/null 2>&1 || warn() { echo "[luks-loop][WARN] $*" >&2; }

LUKS_IMG="/live/luks.img"
LUKS_NAME="live-luks"

info "Checking for LUKS image at $LUKS_IMG ..."

# Controlla se il file esiste nel medium live
if [ -f "$LUKS_IMG" ]; then
    info "Found $LUKS_IMG, creating loop device..."

    LOOPDEV=$(losetup -f)
    losetup "$LOOPDEV" "$LUKS_IMG"

    if [ $? -ne 0 ]; then
        warn "Unable to associate $LUKS_IMG to loop device!"
        exit 1
    fi

    info "Loop device: $LOOPDEV"

    # Verifica se è un volume LUKS
    if cryptsetup isLuks "$LOOPDEV"; then
        info "LUKS detected on $LOOPDEV, opening as /dev/mapper/$LUKS_NAME"

        # Se esiste un file chiave (es. /live/live.key) usa quello, altrimenti chiedi password
        if [ -f "/live/live.key" ]; then
            cryptsetup open "$LOOPDEV" "$LUKS_NAME" --key-file /live/live.key
        else
            cryptsetup open "$LOOPDEV" "$LUKS_NAME"
        fi

        if [ $? -eq 0 ]; then
            info "Successfully opened /dev/mapper/$LUKS_NAME"
        else
            warn "Failed to open LUKS container!"
        fi
    else
        warn "$LUKS_IMG is not a valid LUKS container!"
    fi
else
    warn "$LUKS_IMG not found (skipping luks-loop)"
fi
