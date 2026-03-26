#!/bin/bash
# parse-tool-lists.sh -- Parse common/tool-lists/*.list files and extract
# packages for a specific distro family.
#
# Usage: source parse-tool-lists.sh
#   Requires: RECOVERY_ROOT, FAMILY to be set.
#   Outputs: PACKAGES (space-separated list of native package names)
#
# Tool list format (6 columns, pipe-separated):
#   logical-name | arch-pkg | debian-pkg | fedora-pkg | suse-pkg | alpine-pkg | gentoo-pkg
#
# Legacy 3-column format (arch + debian only) is also supported:
#   logical-name | arch-pkg | debian-pkg

RECOVERY_ROOT="${RECOVERY_ROOT:?RECOVERY_ROOT must be set}"
FAMILY="${FAMILY:?FAMILY must be set}"

# Map family to column index (1-based, column 1 is logical name)
case "$FAMILY" in
    arch)    COL=2 ;;
    debian)  COL=3 ;;
    fedora)  COL=4 ;;
    suse)    COL=5 ;;
    alpine)  COL=6 ;;
    gentoo)  COL=7 ;;
    *)       COL=0 ;;
esac

PACKAGES=""
TOOL_LISTS_DIR="${RECOVERY_ROOT}/common/tool-lists"

for listfile in "$TOOL_LISTS_DIR"/*.list; do
    [ -f "$listfile" ] || continue

    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// /}" ]] && continue

        # Count columns
        NUM_COLS=$(echo "$line" | awk -F'|' '{print NF}')

        if [ "$NUM_COLS" -ge 7 ] && [ "$COL" -le 7 ]; then
            # Full 7-column format
            PKG=$(echo "$line" | awk -F'|' -v col="$COL" '{gsub(/^[ \t]+|[ \t]+$/, "", $col); print $col}')
        elif [ "$NUM_COLS" -ge 3 ] && [ "$COL" -le 3 ]; then
            # Legacy 3-column format
            PKG=$(echo "$line" | awk -F'|' -v col="$COL" '{gsub(/^[ \t]+|[ \t]+$/, "", $col); print $col}')
        else
            # Column not available for this family, try debian column as fallback
            if [ "$NUM_COLS" -ge 3 ]; then
                PKG=$(echo "$line" | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $3); print $3}')
            else
                continue
            fi
        fi

        # Skip empty or placeholder entries
        [[ -z "$PKG" || "$PKG" == "--" ]] && continue

        # Handle multiple packages in one cell (space-separated)
        PACKAGES="$PACKAGES $PKG"
    done < "$listfile"
done

# Deduplicate
PACKAGES=$(echo "$PACKAGES" | tr ' ' '\n' | sort -u | tr '\n' ' ')
export PACKAGES
