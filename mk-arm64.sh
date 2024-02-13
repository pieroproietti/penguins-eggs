#!/bin/bash

# Check if running as root
if [ "$EUID" -ne 0 ]; then  echo "Please run this script as root"
  exit 1
fi

# Exit on error
set -e

# Check if version is provided
if [ "$#" -eq 0 ]; then
  echo "You need to specify version, ex: 9.6.1"
  exit 1
fi

workdir="/home/artisan/penguins-eggs/perrisbrewery/workdir/"
ver=$1
src="${workdir}eggs_${ver}_amd64"
dest="${workdir}eggs_${ver}_arm64"

# Clean up previous build
rm -rf "${dest}"
rm -f "${ver}*.deb"

# Copy source directory to destination
cp -R "${src}" "${dest}"

# Update DEBIAN/control file
sed -i 's/syslinux-common,//g' "${dest}/DEBIAN/control"
sed -i 's/syslinux,//g' "${dest}/DEBIAN/control"
sed -i 's/grub-efi-amd64-bin/grub-efi-arm64-bin, nodejs/g' "${dest}/DEBIAN/control"
sed -i 's/amd64/arm64/g' "${dest}/DEBIAN/control"

# Replace node binary
rm -f "${dest}/usr/lib/penguins-eggs/bin/node"
ln -s /usr/bin/node "${dest}/usr/lib/penguins-eggs/bin/node"

# Build package
cd "${workdir}" || exit
dpkg-deb --build "eggs_${ver}_arm64"