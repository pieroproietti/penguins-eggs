#!/bin/bash

# Check if running as root
if [ "$EUID" -ne 0 ]; then  echo "Please run as root:do ${0} 9..1"
  exit 1
fi

# Check if version is provided
if [ "$#" -eq 0 ]; then
  echo "You need to specify version, ex: 9.6.1"
  exit 1
fi

WORKDIR="/home/artisan/penguins-eggs/perrisbrewery/workdir/"
VER=$1
SRC="${WORKDIR}eggs_${VER}_amd64"
DEST="${WORKDIR}eggs_${VER}_arm64"

# Clean up previous build
rm -rf "${DEST}"
rm -f "${SRC}*.deb"

# Copy source directory to destination
cp -R "${SRC}" "${DEST}"

# Update DEBIAN/control file
sed -i 's/syslinux-common,//g' "${DEST}/DEBIAN/control"
sed -i 's/syslinux,//g' "${DEST}/DEBIAN/control"
sed -i 's/grub-efi-amd64-bin/grub-efi-arm64-bin, nodejs/g' "${DEST}/DEBIAN/control"
sed -i 's/amd64/arm64/g' "${DEST}/DEBIAN/control"

# Replace node binary
rm -f "${DEST}/usr/lib/penguins-eggs/bin/node"
ln -s /usr/bin/node "${DEST}/usr/lib/penguins-eggs/bin/node"

# Build package
cd "${WORKDIR}" || exit
dpkg-deb --build "eggs_${VER}_arm64"