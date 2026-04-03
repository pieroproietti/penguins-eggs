#!/usr/bin/env bash
# chromiumos-stage3/build.sh
#
# Builds a ChromiumOS stage3 tarball for a given board.
# Derived from sebanc/chromiumos-stage3 (amd64/reven) and extended to support
# arm64 boards via openFyde overlays.
#
# Usage:
#   sudo ./build.sh [--board BOARD] [--jobs N] [--output DIR]
#
# Boards (see boards/*.conf):
#   reven          amd64 generic (default) — suitable for container base images
#   arm64-generic  arm64 generic           — suitable for container base images
#   rpi4           Raspberry Pi 4B/400
#   rpi5           Raspberry Pi 5
#   rk3588         Rockchip RK3588 family (ROCK 5B, Orange Pi 5, Firefly)
#   rk3399         Rockchip RK3399 family (Rock Pi 4B, ROCK 4C+)
#   orangepi5      Orange Pi 5/5B/5 Plus
#
# Requirements:
#   - Root access
#   - ~10 GB free disk space (amd64), ~12 GB (arm64)
#   - qemu-user-static (arm64 builds on x86_64 hosts only)
#   - coreutils, git, curl

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Defaults ──────────────────────────────────────────────────────────────────
BOARD_NAME="reven"
JOBS="${JOBS:-$(nproc)}"
OUTPUT_DIR="${OUTPUT_DIR:-${SCRIPT_DIR}}"

# ── Argument parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --board) BOARD_NAME="$2"; shift 2 ;;
    --jobs)  JOBS="$2";       shift 2 ;;
    --output) OUTPUT_DIR="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

BOARD_CONF="${SCRIPT_DIR}/boards/${BOARD_NAME}.conf"
if [[ ! -f "${BOARD_CONF}" ]]; then
  echo "ERROR: No board config found at ${BOARD_CONF}"
  echo "Available boards:"
  ls "${SCRIPT_DIR}/boards/"*.conf | xargs -n1 basename | sed 's/\.conf//'
  exit 1
fi

# shellcheck source=/dev/null
source "${BOARD_CONF}"

echo "==> Building ChromiumOS stage3"
echo "    Board:  ${BOARD}"
echo "    Arch:   ${ARCH}"
echo "    CHOST:  ${CHOST}"
echo "    Jobs:   ${JOBS}"
echo "    Output: ${OUTPUT_DIR}"

# ── Host dependency checks ────────────────────────────────────────────────────
if [[ "${ARCH}" == "arm64" && "$(uname -m)" == "x86_64" ]]; then
  if ! command -v qemu-aarch64-static &>/dev/null; then
    echo "ERROR: qemu-user-static is required for arm64 builds on x86_64."
    echo "  Debian/Ubuntu: apt-get install qemu-user-static"
    echo "  Arch:          pacman -S qemu-user-static"
    exit 1
  fi
  CROSS_BUILD=1
else
  CROSS_BUILD=0
fi

# ── ChromiumOS release detection ──────────────────────────────────────────────
CHROMIUMOS_SHORT_VERSION=R146
CHROMIUMOS_LONG_VERSION=$(git ls-remote \
  https://chromium.googlesource.com/chromiumos/third_party/kernel/ \
  | grep "refs/heads/release-${CHROMIUMOS_SHORT_VERSION}" \
  | head -1 \
  | sed -e 's/.*\t//' -e 's/chromeos-.*//' \
  | sort -u \
  | cut -d'-' -f2,3)

echo "==> ChromiumOS release: ${CHROMIUMOS_SHORT_VERSION} (${CHROMIUMOS_LONG_VERSION})"

# ── Bootstrap chroot ──────────────────────────────────────────────────────────
rm -rf "${SCRIPT_DIR}/chroot"
mkdir "${SCRIPT_DIR}/chroot"

echo "==> Downloading bootstrap (${BOOTSTRAP_ARCH})"
BOOTSTRAP_ARCHIVE="/tmp/chromiumos-bootstrap-${BOOTSTRAP_ARCH}.tar"
curl -L "${BOOTSTRAP_URL}" -o "${BOOTSTRAP_ARCHIVE}.zst" 2>/dev/null || \
  curl -L "${BOOTSTRAP_URL}" -o "${BOOTSTRAP_ARCHIVE}.xz"

if [[ "${BOOTSTRAP_URL}" == *.zst ]]; then
  tar --zstd --strip "${BOOTSTRAP_STRIP}" -xf "${BOOTSTRAP_ARCHIVE}.zst" \
    -C "${SCRIPT_DIR}/chroot"
else
  tar --xz --strip "${BOOTSTRAP_STRIP}" -xf "${BOOTSTRAP_ARCHIVE}.xz" \
    -C "${SCRIPT_DIR}/chroot"
fi

# Register qemu-aarch64-static for arm64 cross-builds
if [[ "${CROSS_BUILD}" == "1" ]]; then
  cp "$(command -v qemu-aarch64-static)" "${SCRIPT_DIR}/chroot/usr/bin/"
fi

# ── Clone openFyde overlays if needed ────────────────────────────────────────
OVERLAYS_DIR="${SCRIPT_DIR}/overlays/${BOARD_NAME}"
if [[ -n "${OVERLAY_REPO:-}" ]]; then
  echo "==> Fetching board overlay: ${OVERLAY_REPO}"
  if [[ ! -d "${OVERLAYS_DIR}/overlay" ]]; then
    git clone --depth=1 -b "${OVERLAY_BRANCH}" \
      "${OVERLAY_REPO}" "${OVERLAYS_DIR}/overlay"
  else
    git -C "${OVERLAYS_DIR}/overlay" pull --ff-only
  fi
fi

if [[ -n "${OVERLAY_BASE_REPO:-}" ]]; then
  echo "==> Fetching board base overlay: ${OVERLAY_BASE_REPO}"
  if [[ ! -d "${OVERLAYS_DIR}/overlay-base" ]]; then
    git clone --depth=1 -b "${OVERLAY_BRANCH}" \
      "${OVERLAY_BASE_REPO}" "${OVERLAYS_DIR}/overlay-base"
  else
    git -C "${OVERLAYS_DIR}/overlay-base" pull --ff-only
  fi
fi

if [[ -n "${FOUNDATION_REPO:-}" ]]; then
  echo "==> Fetching SoC foundation: ${FOUNDATION_REPO}"
  if [[ ! -d "${OVERLAYS_DIR}/foundation" ]]; then
    git clone --depth=1 -b "${FOUNDATION_BRANCH}" \
      "${FOUNDATION_REPO}" "${OVERLAYS_DIR}/foundation"
  else
    git -C "${OVERLAYS_DIR}/foundation" pull --ff-only
  fi
fi

if [[ -n "${PATCHES_REPO:-}" ]]; then
  echo "==> Fetching openFyde patches: ${PATCHES_REPO}"
  if [[ ! -d "${SCRIPT_DIR}/patches/openfyde" ]]; then
    git clone --depth=1 -b "${PATCHES_BRANCH}" \
      "${PATCHES_REPO}" "${SCRIPT_DIR}/patches/openfyde"
  else
    git -C "${SCRIPT_DIR}/patches/openfyde" pull --ff-only
  fi
fi

# ── Bootstrap init script ─────────────────────────────────────────────────────
# Written into the chroot; runs package manager setup and depot_tools fetch.
cat > "${SCRIPT_DIR}/chroot/init" << BOOTSTRAP_INIT
#!/bin/bash
set -e

# ── Mirror selection (amd64 Arch bootstrap only) ──────────────────────────────
if command -v pacman-key &>/dev/null; then
  echo 'nameserver 8.8.8.8' > /etc/resolv.conf
  cur_speed=0
  for mirror in \
    https://geo.mirror.pkgbuild.com \
    https://mirrors.rit.edu/archlinux \
    https://archlinux.mirror.digitalpacific.com.au; do
    avg_speed=\$(curl -fsS -m 5 -r 0-1048576 \
      -w '%{speed_download}' -o /dev/null \
      --url "\${mirror}/core/os/x86_64/core.db" 2>/dev/null || echo 0)
    if [ "\${avg_speed%.*}" -gt "\${cur_speed%.*}" ] 2>/dev/null; then
      cur_speed=\${avg_speed}
      default_mirror=\${mirror}
    fi
  done
  sed -i "s@#Server = \${default_mirror}@Server = \${default_mirror}@g" \
    /etc/pacman.d/mirrorlist
  pacman-key --init
  pacman-key --populate
  pacman -Syu --noconfirm --needed \
    git openssh python sudo tar xz zstd
fi

# ── Debian bootstrap: install build deps ─────────────────────────────────────
if command -v apt-get &>/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y --no-install-recommends \
    git python3 sudo curl wget tar xz-utils zstd ca-certificates
fi

useradd -s /bin/bash -m 'temp' 2>/dev/null || true
echo -e 'temp\ntemp' | passwd 'temp'
echo 'temp ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/90-wheel

cd /home/temp
sudo -u temp bash << 'CHROOT_USER'
set -e
git config --global user.name "ChromiumOS Builder"
git config --global user.email "builder@localhost"

mkdir -p ./build_env/chromiumos
cd ./build_env/chromiumos

git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git \
  ../depot_tools
export PATH=/home/temp/build_env/depot_tools:/usr/sbin:/usr/bin:/sbin:/bin

repo init \
  -u https://chromium.googlesource.com/chromiumos/manifest.git \
  -b release-${CHROMIUMOS_LONG_VERSION} \
  -g minilayout < /dev/null
repo sync -j${JOBS}

cros_sdk << 'CHROMIUMOS_BUILD'
set -e

# Apply openFyde patches if present
if [ -d /mnt/host/source/patches/openfyde ]; then
  for patch in /mnt/host/source/patches/openfyde/*.patch; do
    [ -f "\$patch" ] && git -C /mnt/host/source apply "\$patch" || true
  done
fi

# Register board overlays
if [ -d /mnt/host/source/overlays/${BOARD_NAME}/overlay ]; then
  cp -r /mnt/host/source/overlays/${BOARD_NAME}/overlay \
    /mnt/host/source/src/overlays/overlay-${BOARD}
fi
if [ -d /mnt/host/source/overlays/${BOARD_NAME}/overlay-base ]; then
  cp -r /mnt/host/source/overlays/${BOARD_NAME}/overlay-base \
    /mnt/host/source/src/overlays/overlay-${BOARD}-base
fi
if [ -d /mnt/host/source/overlays/${BOARD_NAME}/foundation ]; then
  cp -r /mnt/host/source/overlays/${BOARD_NAME}/foundation \
    /mnt/host/source/src/overlays/overlay-${BOARD}-foundation
fi

# Remove upstream package constraints that block stage3 builds
rm -f /mnt/host/source/src/third_party/chromiumos-overlay/profiles/targets/chromeos/package.provided
rm -f /mnt/host/source/src/third_party/chromiumos-overlay/profiles/targets/chromeos/package.mask
sudo sed -i -z \
  's@local targetenv@local targetenv\n\treturn@g' \
  /mnt/host/source/src/third_party/chromiumos-overlay/profiles/base/profile.bashrc
sudo rm -f \
  /mnt/host/source/src/third_party/chromiumos-overlay/sys-apps/sed/sed.bashrc \
  /mnt/host/source/src/third_party/chromiumos-overlay/sys-devel/bc/bc.bashrc \
  /mnt/host/source/src/third_party/chromiumos-overlay/sys-apps/mawk/mawk.bashrc

# Patch GCC ebuild for stage3 compatibility
sudo sed -i -z \
  's@local sysroot_wrapper_file=host_wrapper@return\n\t\tlocal sysroot_wrapper_file=host_wrapper@g' \
  /mnt/host/source/src/third_party/chromiumos-overlay/sys-devel/gcc/gcc-*.ebuild
sudo sed -i '/virtual\/perl-Math-BigInt/d' \
  /mnt/host/source/src/third_party/portage-stable/dev-lang/perl/perl-*.ebuild
echo -e '#!/bin/bash\nexec \$1' | \
  sudo tee /mnt/host/source/src/platform2/common-mk/meson_test.py

setup_board --board=${BOARD}

# Board-specific make.conf
sudo tee /build/${BOARD}/etc/portage/make.conf << MAKECONF
CHOST="${CHOST}"
FEATURES="-buildpkg -collision-detect -force-mirror -getbinpkg -protect-owned -sandbox -splitdebug -usersandbox"
GENTOO_MIRRORS="https://storage.googleapis.com/chromeos-mirror/gentoo"
PORTDIR="/var/cache"
MAKEOPTS="--jobs ${JOBS}"
EMERGE_DEFAULT_OPTS="--jobs ${JOBS}"
USE="-hardened -pam"
MAKECONF

# Architecture-specific profile parent
sudo sed -i '/features\/llvm/d' \
  /mnt/host/source/src/third_party/chromiumos-overlay/profiles/${PROFILE_PATH}/parent

# GCC USE flags (multilib for amd64, none for arm64)
if [ -n "${GCC_USE_FLAGS}" ]; then
  echo "sys-devel/gcc ${GCC_USE_FLAGS}" | \
    sudo tee /build/${BOARD}/etc/portage/profile/package.use.force
fi

# Emerge base system
sudo sed -i '/sys-libs\/glibc/!d' /build/${BOARD}/etc/portage/profile/package.provided

emerge-${BOARD} sys-apps/baselayout

echo -e "root:x:0:0:root:/root:/bin/bash\nportage:x:250:250:portage:/var/tmp/portage:/bin/false" | \
  sudo tee /build/${BOARD}/etc/passwd
echo -e "portage::250:portage" | \
  sudo tee /build/${BOARD}/etc/group

# Core package set (same as reven, arch-independent)
emerge-${BOARD} \
  acct-user/chronos acct-group/chronos acct-group/root \
  app-admin/sudo app-alternatives/awk app-alternatives/gzip \
  app-arch/cpio app-editors/nano app-misc/ca-certificates \
  app-misc/jq app-misc/mime-types app-shells/bash \
  chromeos-base/vboot_reference \
  dev-build/libtool dev-build/meson dev-debug/strace \
  dev-lang/go dev-lang/perl dev-lang/python dev-lang/python-exec \
  dev-lang/python-exec-conf dev-libs/json-glib dev-libs/libtasn1 \
  dev-python/ensurepip-pip dev-python/ensurepip-setuptools \
  dev-python/ensurepip-wheels dev-python/installer \
  dev-python/packaging dev-python/setuptools dev-python/wheel \
  dev-util/cmake dev-util/ninja dev-util/pkgconf dev-vcs/git \
  media-libs/libjpeg-turbo media-libs/libpng \
  net-misc/curl net-misc/rsync net-misc/wget \
  sys-apps/attr sys-apps/coreutils sys-apps/diffutils sys-apps/file \
  sys-apps/findutils sys-apps/gawk sys-apps/grep \
  sys-apps/install-xattr sys-apps/locale-gen sys-apps/mawk \
  sys-apps/sandbox sys-apps/sed sys-apps/shadow sys-apps/texinfo \
  sys-apps/util-linux sys-boot/efibootmgr \
  sys-devel/autoconf sys-devel/autoconf-wrapper \
  sys-devel/automake sys-devel/automake-wrapper \
  sys-devel/binutils sys-devel/binutils-config \
  sys-devel/bison sys-devel/flex sys-devel/gcc sys-devel/gcc-config \
  sys-devel/gdb sys-devel/gnuconfig sys-devel/m4 sys-devel/make \
  sys-devel/patch sys-fs/dosfstools sys-fs/ntfs3g \
  sys-kernel/linux-headers sys-libs/libxcrypt sys-process/procps \
  ${EXTRA_PACKAGES}

# Board-specific extras (hardware overlays)
if [ -n "${EXTRA_PACKAGES:-}" ]; then
  emerge-${BOARD} ${EXTRA_PACKAGES}
fi

# Clean up build artifacts not needed in the stage3
sudo mkdir -p /build/${BOARD}/dev /build/${BOARD}/proc /build/${BOARD}/sys
sudo rm -rf \
  /build/${BOARD}/etc/make.conf* \
  /build/${BOARD}/build \
  /build/${BOARD}/packages \
  /build/${BOARD}/sys-include \
  /build/${BOARD}/usr/local \
  /build/${BOARD}/tmp/portage

# Embed Portage overlay references for downstream use
sudo tee /build/${BOARD}/etc/portage/repos.conf << REPOSCONF
[chromiumos]
location = /mnt/host/source/src/third_party/chromiumos-overlay

[portage-stable]
location = /mnt/host/source/src/third_party/portage-stable

[eclass-overlay]
location = /mnt/host/source/src/third_party/eclass-overlay
REPOSCONF

echo 'chronos ALL=(ALL) NOPASSWD: ALL' | \
  sudo tee /build/${BOARD}/etc/sudoers.d/95_cros_base

CHROMIUMOS_BUILD
CHROOT_USER

BOOTSTRAP_INIT

chmod 0755 "${SCRIPT_DIR}/chroot/init"

# ── Run the bootstrap ─────────────────────────────────────────────────────────
echo "==> Running bootstrap (this will take several hours)"
chroot "${SCRIPT_DIR}/chroot" /init

# ── Package the stage3 tarball ────────────────────────────────────────────────
BUILD_ROOT="${SCRIPT_DIR}/chroot/home/temp/build_env/chromiumos/out/build/${BOARD}"
OUTPUT_FILE="${OUTPUT_DIR}/chromiumos-stage3-${BOARD_NAME}-${CHROMIUMOS_SHORT_VERSION}.tar.xz"

echo "==> Packaging stage3 → ${OUTPUT_FILE}"
tar -cJf "${OUTPUT_FILE}" -C "${BUILD_ROOT}" .

echo "==> Done: ${OUTPUT_FILE}"
echo "    Size: $(du -sh "${OUTPUT_FILE}" | cut -f1)"
