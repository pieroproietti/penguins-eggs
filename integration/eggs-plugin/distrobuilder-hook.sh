#!/bin/sh
# penguins-eggs plugin hook for penguins-distrobuilder
#
# Called by eggs produce after ISO creation. Optionally builds a
# distrobuilder image of the produced system for LXC/LXD distribution.
#
# Environment variables (set in eggs config or /etc/penguins-distrobuilder/eggs-hooks.conf):
#   DISTROBUILDER_ENABLED   — set to 1 to activate (default: 0)
#   DISTROBUILDER_TEMPLATE  — path to distrobuilder YAML template
#   DISTROBUILDER_TYPE      — incus | lxc (default: incus)
#   DISTROBUILDER_OUTPUT    — output directory (default: /var/lib/eggs/distrobuilder)

set -e

CONF=/etc/penguins-distrobuilder/eggs-hooks.conf
[ -f "$CONF" ] && . "$CONF"

DISTROBUILDER_ENABLED="${DISTROBUILDER_ENABLED:-0}"
DISTROBUILDER_TYPE="${DISTROBUILDER_TYPE:-incus}"
DISTROBUILDER_OUTPUT="${DISTROBUILDER_OUTPUT:-/var/lib/eggs/distrobuilder}"

if [ "$DISTROBUILDER_ENABLED" != "1" ]; then
    exit 0
fi

if [ -z "$DISTROBUILDER_TEMPLATE" ] || [ ! -f "$DISTROBUILDER_TEMPLATE" ]; then
    echo "penguins-distrobuilder: DISTROBUILDER_TEMPLATE not set or not found, skipping" >&2
    exit 0
fi

mkdir -p "$DISTROBUILDER_OUTPUT"

echo "penguins-distrobuilder: building $DISTROBUILDER_TYPE image from $DISTROBUILDER_TEMPLATE"
distrobuilder "build-${DISTROBUILDER_TYPE}" "$DISTROBUILDER_TEMPLATE" "$DISTROBUILDER_OUTPUT"
echo "penguins-distrobuilder: image written to $DISTROBUILDER_OUTPUT"
