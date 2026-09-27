#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$root"
[[ $(uname -m) == x86_64 ]] || { echo 'This AppImage build currently supports x86_64 only.' >&2; exit 1; }
version=${VERSION:-$(git describe --tags --always 2>/dev/null || echo development)}
[[ $version =~ ^[a-zA-Z0-9._+-]+$ ]] || { echo 'Invalid version' >&2; exit 1; }
output=${APPIMAGE_OUTPUT_DIR:-$root/dist/appimage}
mkdir -p "$output"
output=$(cd "$output" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
appdir="$work/AppDir"
mkdir -p "$appdir/usr/bin" "$appdir/etc/penguins-eggs.d" "$appdir/usr/share/penguins-eggs"
# Separate compilation: no reuse of dynamically linked native-package objects.
${CC:-gcc} -O2 -static -I oa/include oa/src/{main,engine,native,logger,eternit,oa-yocto,cJSON}.c \
    -o "$appdir/usr/bin/oa" -lcrypt
(cd coa && CGO_ENABLED=0 go build -trimpath -ldflags "-s -w -X coa/pkg/cmd.AppVersion=$version" -o "$appdir/usr/bin/coa" .)
ln -s coa "$appdir/usr/bin/eggs"
cp -a coa/brain.d coa/branding.default coa/pkg/assets/configs/scripts "$appdir/etc/penguins-eggs.d/"
cp coa/pkg/assets/configs/custom.yaml coa/pkg/assets/configs/custom.exclude.list "$appdir/etc/penguins-eggs.d/"
cp -a spacemit "$appdir/usr/share/penguins-eggs/"
install -m 0755 packaging/appimage/AppRun packaging/appimage/install-system "$appdir/"
cp packaging/appimage/penguins-eggs.desktop "$appdir/"
cp coa/branding.default/artwork/penguins-eggs.svg "$appdir/"
ln -s penguins-eggs.svg "$appdir/.DirIcon"
cp LICENSE "$appdir/"
# Supply a locally verified tool/runtime for offline builds, or download the pinned releases.
tool=${APPIMAGETOOL:-$work/appimagetool}
if [ -z "${APPIMAGETOOL:-}" ]; then
    curl -fL --retry 3 https://github.com/AppImage/appimagetool/releases/download/1.9.1/appimagetool-x86_64.AppImage -o "$tool"
    chmod +x "$tool"
fi
runtime=${APPIMAGE_RUNTIME:-$work/runtime-x86_64}
if [ -z "${APPIMAGE_RUNTIME:-}" ]; then
    curl -fL --retry 3 https://github.com/AppImage/type2-runtime/releases/download/continuous/runtime-x86_64 -o "$runtime"
fi
artifact="$output/penguins-eggs-$version-x86_64.AppImage"
ARCH=x86_64 APPIMAGE_EXTRACT_AND_RUN=1 "$tool" --runtime-file "$runtime" "$appdir" "$artifact"
(cd "$output" && sha256sum "$(basename "$artifact")" > "$(basename "$artifact").sha256")
printf 'Created %s\n' "$artifact"
