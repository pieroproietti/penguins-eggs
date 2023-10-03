#!/bin/bash
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root: sudo ./i386make.sh 9.6.1"
  exit
fi

FR="/home/artisan/penguins-eggs/perrisbrewery/workdir/"
VER=$1
SRC="${FR}eggs_${VER}_amd64"
DEST="${FR}eggs_${VER}_arm64"
rm -rf "DEST"
rm -f "${SRC}*.deb"
cp ${SRC} ${DEST} -R
sed -i 's/grub-efi-amd64-bin/nodejs/g' ${DEST}/DEBIAN/control
sed -i 's/amd64/arm64/g' ${DEST}/DEBIAN/control
rm -f "${DEST}/usr/lib/penguins-eggs/bin/node"
clear
echo "Continue with following commands"
echo ""
echo "remove: isolinux, syslinux, syslinux-commond from dependences in control"
echo "cd ${DEST}/usr/lib/penguins-eggs/bin"
echo "sudo ln -s ../../../bin/node ./node"
echo "cd ${FR}"
echo "sudo dpkg-deb --build eggs_${VER}_arm64/"
echo "eggs export deb -a"
