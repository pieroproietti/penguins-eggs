#!/bin/bash

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
  echo "Please run this script as root"
  exit 1
fi

# Exit on error
set -e

# Check if version is provided
if [ -z "$1" ]; then
  echo "You need to specify version, ex: 9.6.1"
  exit 1
fi

workdir="/home/artisan/penguins-eggs/perrisbrewery/workdir/"
ver="$1"
src="${workdir}eggs_${ver}_amd64"
dest="${workdir}eggs_${ver}_i386"

# Remove previous destination directory
rm -rf "${dest}"

# Remove previously created deb files
rm -f "${src}*.deb"

# Copy source directory to destination
cp -R "${src}" "${dest}"

# Replace 'grub-efi-amd64-bin' with 'nodejs' in the control file
sed -i 's/grub-efi-amd64-bin/nodejs/g' "${dest}/DEBIAN/control"

# Replace 'amd64' with 'i386' in the control file
sed -i 's/amd64/i386/g' "${dest}/DEBIAN/control"

# Remove node binary from destination directory
rm -f "${dest}/usr/lib/penguins-eggs/bin/node"

# Create a symbolic link to the system node binary
ln -s /usr/bin/node "${dest}/usr/lib/penguins-eggs/bin/node"

# Build the package
cd "${workdir}"
dpkg-deb --build "eggs_${ver}_i386"