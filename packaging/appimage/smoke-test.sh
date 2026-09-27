#!/usr/bin/env bash
set -euo pipefail
artifact=$(realpath "${1:?Usage: smoke-test.sh path.AppImage}")
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
cd "$work"
"$artifact" --appimage-extract >/dev/null
appdir="$work/squashfs-root"
"$appdir/AppRun" version
"$appdir/AppRun" --help >/dev/null
# Ensure neither executable needs a host ELF loader or shared libraries.
for binary in coa oa; do
    if readelf -l "$appdir/usr/bin/$binary" | grep -q INTERP; then
        echo "$binary is not static" >&2
        exit 1
    fi
done
test -s "$appdir/etc/penguins-eggs.d/brain.d/index.yaml"
test -x "$appdir/etc/penguins-eggs.d/scripts/bootloader-copy.sh"
test -x "$appdir/install-system"
# An empty input is rejected before logging or any engine task is executed.
if "$appdir/usr/bin/oa" </dev/null 2>"$work/oa-error"; then
    echo 'oa unexpectedly accepted an empty plan' >&2
    exit 1
fi
grep -q 'No JSON plan received' "$work/oa-error"
echo 'AppImage smoke test passed.'
