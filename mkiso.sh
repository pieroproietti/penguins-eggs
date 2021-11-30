#!/bin/sh

# Created at: 2021-11-30_1002
# By: penguins_eggs v. 16.13.0
# ==> Perri's Brewery edition <== 
# Prima di avviare eggs dare:
# editare eggs.yaml initrd_img: /boot/initrd-linux.img
# sudo pacman -S syslinux squashfs-tools xorriso rsync


sudo rm /home/eggs/ovarium/iso/syslinux -rf
sudo mkdir /home/eggs/ovarium/iso/syslinux
sudo cp /usr/lib/syslinux/bios/isolinux.bin /home/eggs/ovarium/iso/syslinux
cd /home/eggs/ovarium
sudo xorriso -as mkisofs -volid xfce \
    -joliet \
    -joliet-long \
    -iso-level 3 \
    -isohybrid-mbr /usr/lib/syslinux/bios/isohdpfx.bin \
    -partition_offset 16 \
    -eltorito-boot syslinux/isolinux.bin \
    -no-emul-boot \
    -boot-load-size 4 \
    -boot-info-table \
    -output /home/eggs/egg-of-endeavouros-rolling-xfce-amd64_2021-11-30_1002.iso \
    /home/eggs/ovarium/iso/
