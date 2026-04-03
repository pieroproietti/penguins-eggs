#!/usr/bin/env bash
# manifests/bin/build-talos-image.sh
#
# Downloads a Talos Linux release and repackages it as an Incus-compatible
# unified tarball (rootfs.tar.xz + metadata.tar.xz).
#
# Talos has no traditional userspace — the "container" image is the Talos
# installer/system image wrapped for Incus VM use only.
#
# Source: f-bn/incus-images
#
# Usage:
#   ./build-talos-image.sh [--version VERSION] [--arch ARCH] [--output DIR]
#
# Examples:
#   ./build-talos-image.sh
#   ./build-talos-image.sh --version v1.7.6 --arch amd64
#   ./build-talos-image.sh --version v1.7.6 --arch arm64 --output /tmp/images

set -Eeuo pipefail

TALOS_VERSION="${TALOS_VERSION:-v1.7.6}"
ARCH="${ARCH:-amd64}"
OUTPUT_DIR="${OUTPUT_DIR:-.}"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version) TALOS_VERSION="$2"; shift 2 ;;
    --arch)    ARCH="$2";          shift 2 ;;
    --output)  OUTPUT_DIR="$2";   shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# Map to Talos arch naming
case "${ARCH}" in
  amd64|x86_64) TALOS_ARCH="amd64" ;;
  arm64|aarch64) TALOS_ARCH="arm64" ;;
  *) echo "ERROR: Unsupported arch: ${ARCH}"; exit 1 ;;
esac

SERIAL="$(date +%Y%m%d)"
IMAGE_NAME="talos-${TALOS_VERSION}-${TALOS_ARCH}-${SERIAL}"
DOWNLOAD_URL="https://github.com/siderolabs/talos/releases/download/${TALOS_VERSION}/metal-${TALOS_ARCH}.raw.xz"

echo "==> Talos Linux ${TALOS_VERSION} (${TALOS_ARCH})"
echo "    Source: ${DOWNLOAD_URL}"
echo "    Output: ${OUTPUT_DIR}/${IMAGE_NAME}/"

mkdir -p "${OUTPUT_DIR}/${IMAGE_NAME}"

# ── Download raw disk image ───────────────────────────────────────────────────
echo "==> Downloading Talos raw image"
curl -L --progress-bar "${DOWNLOAD_URL}" -o "${WORK_DIR}/metal.raw.xz"
xz -d "${WORK_DIR}/metal.raw.xz"

# ── Extract the root partition ────────────────────────────────────────────────
echo "==> Extracting root filesystem"
# Talos raw image: partition 1 = EFI, partition 2 = boot, partition 3 = system
SECTOR_SIZE=512
PART_START=$(fdisk -l "${WORK_DIR}/metal.raw" \
  | awk '/^\/dev\/loop/ && /Linux/ {print $2; exit}')

if [[ -z "${PART_START}" ]]; then
  # Fallback: use sfdisk JSON output
  PART_START=$(sfdisk -J "${WORK_DIR}/metal.raw" \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
parts=[p for p in d['partitiontable']['partitions'] if p.get('type','')=='0FC63DAF-8483-4772-8E79-3D69D8477DE4']
print(parts[0]['start'] if parts else '')
")
fi

OFFSET=$(( PART_START * SECTOR_SIZE ))
mkdir -p "${WORK_DIR}/rootfs"
mount -o loop,offset="${OFFSET}",ro "${WORK_DIR}/metal.raw" "${WORK_DIR}/rootfs"
trap 'umount "${WORK_DIR}/rootfs" 2>/dev/null || true; rm -rf "${WORK_DIR}"' EXIT

# ── Build rootfs tarball ──────────────────────────────────────────────────────
echo "==> Building rootfs.tar.xz"
tar -cJf "${OUTPUT_DIR}/${IMAGE_NAME}/rootfs.tar.xz" \
  -C "${WORK_DIR}/rootfs" \
  --exclude="./proc/*" \
  --exclude="./sys/*" \
  --exclude="./dev/*" \
  --exclude="./run/*" \
  .

umount "${WORK_DIR}/rootfs"

# ── Build metadata tarball ────────────────────────────────────────────────────
echo "==> Building metadata.tar.xz"
mkdir -p "${WORK_DIR}/metadata"

cat > "${WORK_DIR}/metadata/metadata.yaml" << METADATA
architecture: "${TALOS_ARCH}"
creation_date: $(date +%s)
properties:
  description: Talos Linux ${TALOS_VERSION} ${TALOS_ARCH}
  os: talos
  release: "${TALOS_VERSION}"
  variant: default
  architecture: "${TALOS_ARCH}"
  serial: "${SERIAL}"
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
