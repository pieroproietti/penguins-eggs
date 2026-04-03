#!/bin/sh
# penguins-recovery plugin hook for penguins-distrobuilder
#
# Called by penguins-recovery before a factory reset. Snapshots the
# current container/VM state via distrobuilder pack so it can be
# restored after the reset.
#
# Environment variables:
#   DISTROBUILDER_RECOVERY_ENABLED  — set to 1 to activate (default: 0)
#   DISTROBUILDER_RECOVERY_ROOTFS   — rootfs path to snapshot (default: /)
#   DISTROBUILDER_RECOVERY_OUTPUT   — output directory for snapshot image

set -e

CONF=/etc/penguins-distrobuilder/eggs-hooks.conf
[ -f "$CONF" ] && . "$CONF"

DISTROBUILDER_RECOVERY_ENABLED="${DISTROBUILDER_RECOVERY_ENABLED:-0}"
DISTROBUILDER_RECOVERY_ROOTFS="${DISTROBUILDER_RECOVERY_ROOTFS:-/}"
DISTROBUILDER_RECOVERY_OUTPUT="${DISTROBUILDER_RECOVERY_OUTPUT:-/var/lib/eggs/distrobuilder/recovery}"

if [ "$DISTROBUILDER_RECOVERY_ENABLED" != "1" ]; then
    exit 0
fi

mkdir -p "$DISTROBUILDER_RECOVERY_OUTPUT"
LABEL="pre-reset-$(date +%Y%m%d-%H%M%S)"

echo "penguins-distrobuilder: snapshotting $DISTROBUILDER_RECOVERY_ROOTFS -> $DISTROBUILDER_RECOVERY_OUTPUT/$LABEL"
distrobuilder pack-incus "$DISTROBUILDER_RECOVERY_ROOTFS" "$DISTROBUILDER_RECOVERY_OUTPUT/$LABEL" 2>/dev/null || \
distrobuilder pack-lxc   "$DISTROBUILDER_RECOVERY_ROOTFS" "$DISTROBUILDER_RECOVERY_OUTPUT/$LABEL"
echo "penguins-distrobuilder: snapshot saved as $LABEL"
