#!/usr/bin/env bash
# Build a self-contained AppImage for lkm-gui.
#
# Strategy:
#   1. Download a python-appimage base (Python 3.12 bundled in an AppImage).
#   2. Extract it to AppDir/.
#   3. pip-install lkm[pyside6] into the bundled Python.
#   4. Write a custom AppRun launcher.
#   5. Run appimagetool to produce the final .AppImage.
#
# Usage:
#   bash pkg/appimage/build-appimage.sh [--arch x86_64|aarch64] [--out DIR]
#
# Environment overrides:
#   ARCH     Target architecture (default: $(uname -m))
#   OUT_DIR  Output directory    (default: dist/)
#
# Requirements on the host:
#   wget, FUSE (libfuse2 or libfuse3), Python 3.12+, pip

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ── Parse arguments ───────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --arch)  ARCH="$2";    shift 2 ;;
        --out)   OUT_DIR="$2"; shift 2 ;;
        *)       echo "Unknown argument: $1" >&2; exit 1 ;;
    esac
done

ARCH="${ARCH:-$(uname -m)}"
OUT_DIR="${OUT_DIR:-${REPO_ROOT}/dist}"

# Resolve version from installed package or pyproject.toml
VERSION="$(python3 -c "import importlib.metadata; print(importlib.metadata.version('lkm'))" 2>/dev/null \
    || grep '^version' "${REPO_ROOT}/pyproject.toml" | head -1 | sed 's/.*= *"\(.*\)"/\1/')"

APPDIR="${REPO_ROOT}/AppDir"

# python-appimage releases: https://github.com/niess/python-appimage/releases
PYTHON_VERSION="3.12.3"
PYTHON_APPIMAGE_URL="https://github.com/niess/python-appimage/releases/download/python3.12/python${PYTHON_VERSION}-cp312-cp312-manylinux2014_${ARCH}.AppImage"

APPIMAGETOOL_URL="https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${ARCH}.AppImage"

echo "==> Building LKM ${VERSION} AppImage for ${ARCH}"
echo "    Output: ${OUT_DIR}"

# ── 1. Download python-appimage base ─────────────────────────────────────────
BASE_APPIMAGE="/tmp/python${PYTHON_VERSION}-${ARCH}.AppImage"
if [[ ! -f "${BASE_APPIMAGE}" ]]; then
    echo "==> Downloading Python ${PYTHON_VERSION} AppImage base..."
    wget -q --show-progress -O "${BASE_APPIMAGE}" "${PYTHON_APPIMAGE_URL}"
    chmod +x "${BASE_APPIMAGE}"
fi

# ── 2. Extract base AppImage ──────────────────────────────────────────────────
rm -rf "${APPDIR}"
echo "==> Extracting base AppImage..."
pushd "${REPO_ROOT}" > /dev/null
"${BASE_APPIMAGE}" --appimage-extract > /dev/null
mv squashfs-root "${APPDIR}"
popd > /dev/null

# ── 3. Install lkm into the AppDir's Python ───────────────────────────────────
PYTHON="${APPDIR}/usr/bin/python3.12"
echo "==> Installing lkm[pyside6] into AppDir..."
"${PYTHON}" -m pip install --quiet \
    --no-warn-script-location \
    "${REPO_ROOT}[pyside6]"

# ── 4. Write AppRun ───────────────────────────────────────────────────────────
cat > "${APPDIR}/AppRun" << 'APPRUN'
#!/bin/bash
HERE="$(dirname "$(readlink -f "${0}")")"
export PATH="${HERE}/usr/bin:${PATH}"
export PYTHONPATH="${HERE}/usr/lib/python3.12/site-packages:${PYTHONPATH:-}"
export LD_LIBRARY_PATH="${HERE}/usr/lib:${LD_LIBRARY_PATH:-}"
# Qt platform plugins
export QT_PLUGIN_PATH="${HERE}/usr/lib/python3.12/site-packages/PySide6/Qt/plugins:${QT_PLUGIN_PATH:-}"
exec "${HERE}/usr/bin/lkm-gui" "$@"
APPRUN
chmod +x "${APPDIR}/AppRun"

# ── 5. Desktop file & icon ────────────────────────────────────────────────────
cp "${SCRIPT_DIR}/../flatpak/io.github.lkm.lkm.desktop" \
   "${APPDIR}/io.github.lkm.lkm.desktop"

ICON_SRC="${SCRIPT_DIR}/../flatpak/io.github.lkm.lkm.png"
if [[ -f "${ICON_SRC}" ]]; then
    cp "${ICON_SRC}" "${APPDIR}/io.github.lkm.lkm.png"
elif command -v convert &>/dev/null; then
    # Generate a placeholder icon with ImageMagick
    convert -size 256x256 xc:'#1e1e2e' \
        -fill '#cdd6f4' -font DejaVu-Sans-Bold -pointsize 48 \
        -gravity Center -annotate 0 'LKM' \
        "${APPDIR}/io.github.lkm.lkm.png"
else
    echo "WARNING: No icon found and ImageMagick not available; AppImage will lack an icon." >&2
fi

# ── 6. Download appimagetool ──────────────────────────────────────────────────
APPIMAGETOOL="/tmp/appimagetool-${ARCH}.AppImage"
if [[ ! -f "${APPIMAGETOOL}" ]]; then
    echo "==> Downloading appimagetool..."
    wget -q --show-progress -O "${APPIMAGETOOL}" "${APPIMAGETOOL_URL}"
    chmod +x "${APPIMAGETOOL}"
fi

# ── 7. Build the AppImage ─────────────────────────────────────────────────────
mkdir -p "${OUT_DIR}"
OUTPUT="${OUT_DIR}/LKM-${VERSION}-${ARCH}.AppImage"
echo "==> Running appimagetool..."
ARCH="${ARCH}" "${APPIMAGETOOL}" --no-appstream "${APPDIR}" "${OUTPUT}"

echo ""
echo "AppImage written to: ${OUTPUT}"
