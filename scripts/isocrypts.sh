#!/bin/bash
# https://askubuntu.com/questions/1041916/booting-encrypted-squashfs-from-live-cd

echo 
echo Setting up /tmp/livecd
echo 
sudo mkdir -p /tmp/livecd/cd/{casper,boot/grub} /tmp/livecd/chroot/rootfs /tmp/livecd/mnt

echo 
echo Installing necessary packages
echo 
sudo apt-get update
sudo apt-get install -y grub2 xorriso squashfs-tools cryptsetup

echo 
echo Copying over existing system
echo 
sudo rsync -av --one-file-system --exclude=/swapfile --exclude=/proc/* --exclude=/dev/* \
--exclude=/sys/* --exclude=/tmp/* --exclude=/lost+found \
--exclude=/var/tmp/* --exclude=/boot/grub/* --exclude=/root/* \
--exclude=/var/mail/* --exclude=/var/spool/* --exclude=/media/* \
--exclude=/etc/fstab --exclude=/etc/mtab --exclude=/etc/hosts \
--exclude=/etc/timezone \
--exclude=/etc/X11/xorg.conf* --exclude=/etc/gdm/custom.conf \
--exclude=/etc/lightdm/lightdm.conf --exclude=/tmp/livecd/chroot/rootfs / /tmp/livecd/chroot/rootfs

echo 
echo Setting up links to chroot
echo 
sudo mount --bind /dev/ /tmp/livecd/chroot/rootfs/dev
sudo mount -t proc proc /tmp/livecd/chroot/rootfs/proc
sudo mount -t sysfs sysfs /tmp/livecd/chroot/rootfs/sys
sudo mount -o bind /run /tmp/livecd/chroot/rootfs/run

echo 
echo Processing chroot commands
echo 
cat <<'ABC' | sudo chroot /tmp/livecd/chroot/rootfs /bin/bash
LANG=
apt-get update
apt-get install -y casper lupin-casper
cat >> /etc/cryptsetup-initramfs/conf-hook <<'DEF'
CRYPTSETUP=Y
DEF
patch -d /usr/share/initramfs-tools/scripts /usr/share/initramfs-tools/scripts/casper-helpers <<'GHI'
@@ -141,6 +141,13 @@
                 losetup -o "$offset" "$dev" "$fspath"
             else
                 losetup "$dev" "$fspath"
+                modprobe dm-crypt
+                mkdir /mnt
+                echo "Enter passphrase: " >&6
+                cryptsetup --type plain -c aes-xts-plain64 -h sha512 -s 512 open "$dev" squash >&6
+                mount -t ext4 /dev/mapper/squash /mnt
+                dev="$(losetup -f)"
+                losetup "$dev" /mnt/filesystem.squashfs
             fi
             echo "$dev"
             return 0
GHI
depmod -a $(uname -r)
update-initramfs -u -k $(uname -r)
apt autoremove
apt clean
find /var/log -regex '.*?[0-9].*?' -exec rm -v {} \;
find /var/log -type f | while read file
do
        cat /dev/null | tee $file
done
rm /etc/resolv.conf /etc/hostname
exit
ABC

echo 
echo Copying chroot images to livecd
echo 
export kversion=`cd /tmp/livecd/chroot/rootfs/boot && ls -1 vmlinuz-* | tail -1 | sed 's@vmlinuz-@@'`
sudo cp -vp /tmp/livecd/chroot/rootfs/boot/vmlinuz-${kversion} /tmp/livecd/cd/casper/vmlinuz
sudo cp -vp /tmp/livecd/chroot/rootfs/boot/initrd.img-${kversion} /tmp/livecd/cd/casper/initrd.img
sudo cp -vp /tmp/livecd/chroot/rootfs/boot/memtest86+.bin /tmp/livecd/cd/boot

echo 
echo Removing chroot links
echo 
sudo umount /tmp/livecd/chroot/rootfs/proc
sudo umount /tmp/livecd/chroot/rootfs/sys
sudo umount /tmp/livecd/chroot/rootfs/dev

echo 
echo Creating the squashfs file
echo 
sudo mksquashfs /tmp/livecd/chroot/rootfs /tmp/livecd/filesystem.squashfs -noappend

echo 
echo Setting up encrypted squashfs file
echo 
size=$(du --block-size=1 /tmp/livecd/filesystem.squashfs | awk '{print $1}')
((size=size+size/10))
((size=size/1024))
echo $size
sudo dd if=/dev/zero of=/tmp/livecd/cd/casper/filesystem.squashfs bs=1024 count=$size status=progress
dev="$(losetup -f)"
sudo losetup "$dev" /tmp/livecd/cd/casper/filesystem.squashfs

echo 
echo Enter a large string of random text below to setup the pre-encryption.
echo 
sudo cryptsetup --type plain -c aes-xts-plain64 -h sha512 -s 512 open "$dev" squash

echo 
echo Pre-encrypting entire squshfs with random data
echo 
sudo dd if=/dev/zero of=/dev/mapper/squash bs=1M status=progress
sync
sync
sync
sync
sudo cryptsetup close squash

echo 
echo Enter the desired passphrase for the encrypted livecd below.
echo 
sudo cryptsetup --type plain -c aes-xts-plain64 -h sha512 -s 512 open "$dev" squash

echo 
echo Creating ext4 into encrypted container
echo 
sudo mkfs.ext4 -m 0 /dev/mapper/squash
sudo mount -t ext4 /dev/mapper/squash /tmp/livecd/mnt

echo 
echo Moving unencrypted squashfs file into encrypted sqaushfs container
echo 
sudo mv /tmp/livecd/filesystem.squashfs /tmp/livecd/mnt
sync
sync
sync
sync
sudo umount /tmp/livecd/mnt
sudo cryptsetup close squash
sudo losetup -d "$dev"

echo 
echo Creating size and md5sum cd files
echo 
echo -n $(sudo du -s --block-size=1 /tmp/livecd/chroot/rootfs | tail -1 | awk '{print $1}') | sudo tee /tmp/livecd/cd/casper/filesystem.size
find /tmp/livecd/cd -type f -print0 | sudo xargs -0 md5sum | sed "s@/tmp/livecd/cd@.@" | grep -v md5sum.txt | sudo tee -a /tmp/livecd/cd/md5sum.txt

echo 
echo Creating grub.cfg for the livecd
echo 
sudo bash -c 'cat > /tmp/livecd/cd/boot/grub/grub.cfg <<EOF
set default="0"
set timeout=10

menuentry "Ubuntu GUI from RAM" {
linux /casper/vmlinuz boot=casper toram quiet
initrd /casper/initrd.img
}

EOF'

filesize=$(sudo du --block-size=1 -s /tmp/livecd/cd/casper/filesystem.squashfs | tail -1 | awk '{print $1}')

echo "filesystem.squashfs size: $filesize"

devflag=0

if [ $filesize -lt 4294967295 ]
then
    echo
    echo filesystem.squashfs is under the 4GB iso6990 limit
    echo
    echo "Create a bootable iso or bootable device img for (usb, hd)?"
    select yn in "iso" "dev"; do
        case $yn in
        iso )   echo;
            echo Creating bootable ISO at /tmp/livecd for the now encrypted livecd;
            echo;
            sudo grub-mkrescue -o /tmp/livecd/live-cd.iso /tmp/livecd/cd;
            echo
            echo COMPLETE!
            echo
            break;;
        dev )   devflag=1;
            break;;
        esac
    done
else
    devflag=1
fi

if [ $devflag -eq 1 ]
then
    echo
    echo Setting up /tmp/livecd/live-cd.img
    echo
    filesize=$(sudo du -s --block-size=1 /tmp/livecd/cd | tail -1 | awk '{print $1}')
    ((filesize=filesize+filesize/10))
    ((filesize=filesize/1024))
    sudo dd if=/dev/zero of=/tmp/livecd/live-cd.img bs=1024 count=$filesize status=progress
    dev="$(losetup -f)"
    sudo losetup $dev /tmp/livecd/live-cd.img
    echo
    echo Formating /tmp/livecd/live-cd.img to ext4
    echo
    sudo mkfs.ext4 -m 0 $dev
    echo
    echo Installing grub and copying live system files
    echo
    sudo mount -t ext4 $dev /tmp/livecd/mnt
    sudo grub-install --no-floppy --force --root-directory=/tmp/livecd/mnt $dev
    sudo rsync -av --one-file-system /tmp/livecd/cd/ /tmp/livecd/mnt
    sync
    sync
    sync
    sync
    sudo umount /tmp/livecd/mnt
    sudo losetup -d $dev
    echo
    echo COMPLETE!
    echo live-cd.img can now be written to a usb or hard drive using dd or similar
    echo
fi