#!/bin/bash
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root: sudo ${0} 9.6.1"
  exit
fi

if [ $# -eq 0 ]; then
  echo "You need to specify version, ex: 9.6.1"
  exit
fi

FR="/home/artisan/penguins-eggs/perrisbrewery/workdir/"
VER=$1
SRC="${FR}eggs_${VER}_amd64"
DEST="${FR}eggs_${VER}_arm64"
rm -rf "DEST"
rm -f "${SRC}*.deb"
cp "${SRC}" "${DEST}" -R

# remove syslinux-common, syslinux
sed -i 's/syslinux-common,//g' "${DEST}/DEBIAN/control"
sed -i 's/syslinux,//g' "${DEST}/DEBIAN/control"

#sed -i 's/grub-efi-amd64-bin/nodejs/g' "${DEST}/DEBIAN/control"
sed -i 's/grub-efi-amd64-bin/grub-efi-arm64-bin, nodejs/g' "${DEST}/DEBIAN/control"

sed -i 's/amd64/arm64/g' "${DEST}/DEBIAN/control"

# Remove node inside bin
rm -f "${DEST}/usr/lib/penguins-eggs/bin/node"
# and replace with ln -s /bin/node
ln -s /usr/bin/node "${DEST}/usr/lib/penguins-eggs/bin/node"

# build package
cd ${FR}
sudo dpkg-deb --build eggs_${VER}_arm64/
