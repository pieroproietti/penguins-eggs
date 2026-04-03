#!/usr/bin/env bash
# manifests/bin/build-chromiumos-image.sh
#
# Downloads a pre-built ChromiumOS stage3 tarball (from the chromiumos-stage3
# component of this project) and repackages it as an Incus-compatible unified
# tarball (rootfs.tar.xz + metadata.tar.xz).
#
# The stage3 is a ChromiumOS build-environment container — it contains the
# ChromiumOS Portage tree, toolchain, and base userspace. It is NOT a
# ChromiumOS desktop/runtime image.
#
# Usage:
#   ./build-chromiumos-image.sh [--board BOARD] [--release RELEASE] [--output DIR]
#
# Boards:
#   reven         amd64 generic (default) — from sebanc/chromiumos-stage3 releases
#   arm64-generic arm64 generic           — from this project's CI releases
#
# Examples:
#   ./build-chromiumos-image.sh
#   ./build-chromiumos-image.sh --board arm64-generic --release R146
#   ./build-chromiumos-image.sh --board reven --output /tmp/images

set -Eeuo pipefail

BOARD="${BOARD:-reven}"
RELEASE="${RELEASE:-R146}"
OUTPUT_DIR="${OUTPUT_DIR:-.}"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

# GitHub repo publishing pre-built stage3 tarballs
STAGE3_REPO="${STAGE3_REPO:-}"  # override for self-hosted releases
STAGE3_GITHUB_REPO="sebanc/chromiumos-stage3"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --board)   BOARD="$2";      shift 2 ;;
    --release) RELEASE="$2";    shift 2 ;;
    --output)  OUTPUT_DIR="$2"; shift 2 ;;
    --repo)    STAGE3_REPO="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# Derive arch from board name
case "${BOARD}" in
  reven)         ARCH="amd64" ;;
  arm64-generic|rpi4|rpi5|rk3588|rk3399|orangepi5) ARCH="arm64" ;;
  *) echo "ERROR: Unknown board '${BOARD}'. See chromiumos-stage3/boards/ for options."; exit 1 ;;
esac

SERIAL="$(date +%Y%m%d)"
IMAGE_NAME="chromiumos-${BOARD}-${RELEASE}-${SERIAL}"

# ── Resolve stage3 tarball URL ────────────────────────────────────────────────
if [[ -n "${STAGE3_REPO}" ]]; then
  # Direct URL override (e.g. self-hosted or local file)
  TARBALL_URL="${STAGE3_REPO}/chromiumos-stage3-${BOARD}-${RELEASE}.tar.xz"
elif [[ "${BOARD}" == "reven" ]]; then
  # sebanc/chromiumos-stage3 publishes reven releases
  TARBALL_URL="$(curl -fsSL \
    "https://api.github.com/repos/${STAGE3_GITHUB_REPO}/releases/latest" \
    | python3 -c "
import json,sys
data=json.load(sys.stdin)
assets=[a['browser_download_url'] for a in data.get('assets',[]) if a['name'].endswith('.tar.xz')]
print(assets[0] if assets else '')
")"
  if [[ -z "${TARBALL_URL}" ]]; then
    echo "ERROR: Could not find a release tarball in ${STAGE3_GITHUB_REPO}"
    exit 1
  fi
else
  # arm64 and hardware boards: built by this project's CI
  # Expect the tarball to be published under the unified-image-server releases
  echo "ERROR: No pre-built tarball available for board '${BOARD}'."
  echo "  Build it first: cd chromiumos-stage3 && sudo ./build.sh --board ${BOARD}"
  echo "  Then re-run with: --repo file:///path/to/output"
  exit 1
fi

echo "==> ChromiumOS stage3 → Incus image"
echo "    Board:   ${BOARD}"
echo "    Arch:    ${ARCH}"
echo "    Release: ${RELEASE}"
echo "    Source:  ${TARBALL_URL}"
echo "    Output:  ${OUTPUT_DIR}/${IMAGE_NAME}/"

mkdir -p "${OUTPUT_DIR}/${IMAGE_NAME}"

# ── Download stage3 tarball ───────────────────────────────────────────────────
echo "==> Downloading stage3"
TARBALL="${WORK_DIR}/chromiumos-stage3.tar.xz"
if [[ "${TARBALL_URL}" == file://* ]]; then
  cp "${TARBALL_URL#file://}" "${TARBALL}"
else
  curl -L --progress-bar "${TARBALL_URL}" -o "${TARBALL}"
fi

# ── Strip build-only artifacts before repackaging ────────────────────────────
# The stage3 contains Portage build infrastructure not needed at container
# runtime. Strip the heaviest directories to reduce image size.
echo "==> Extracting and stripping stage3"
mkdir -p "${WORK_DIR}/rootfs"
tar -xJf "${TARBALL}" -C "${WORK_DIR}/rootfs"

# Remove build-time-only paths
for strip_path in \
  var/cache/distfiles \
  var/cache/binpkgs \
  usr/local/portage \
  mnt/host; do
  rm -rf "${WORK_DIR}/rootfs/${strip_path}"
done

# ── Build rootfs tarball ──────────────────────────────────────────────────────
echo "==> Building rootfs.tar.xz"
tar -cJf "${OUTPUT_DIR}/${IMAGE_NAME}/rootfs.tar.xz" \
  -C "${WORK_DIR}/rootfs" \
  --exclude="./proc/*" \
  --exclude="./sys/*" \
  --exclude="./dev/*" \
  --exclude="./run/*" \
  .

# ── Build metadata tarball ────────────────────────────────────────────────────
echo "==> Building metadata.tar.xz"
mkdir -p "${WORK_DIR}/metadata"

cat > "${WORK_DIR}/metadata/metadata.yaml" << METADATA
architecture: "${ARCH}"
creation_date: $(date +%s)
properties:
  description: ChromiumOS ${RELEASE} ${BOARD} build environment
  os: chromiumos
  release: "${RELEASE}"
  variant: default
  architecture: "${ARCH}"
  serial: "${SERIAL}"
  board: "${BOARD}"
templates: {}
METADATA

tar -cJf "${OUTPUT_DIR}/${IMAGE_NAME}/metadata.tar.xz" \
  -C "${WORK_DIR}/metadata" \
  metadata.yaml

# ── Compute hashes ────────────────────────────────────────────────────────────
echo "==> Computing hashes"
sha256sum "${OUTPUT_DIR}/${IMAGE_NAME}/rootfs.tar.xz" \
  | awk '{print $1}' > "${OUTPUT_DIR}/${IMAGE_NAME}/rootfs.tar.xz.sha256"
sha256sum "${OUTPUT_DIR}/${IMAGE_NAME}/metadata.tar.xz" \
  | awk '{print $1}' > "${OUTPUT_DIR}/${IMAGE_NAME}/metadata.tar.xz.sha256"

echo "==> Done"
ls -lh "${OUTPUT_DIR}/${IMAGE_NAME}/"
