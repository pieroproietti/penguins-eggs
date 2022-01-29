# Trying to use a luks-volume to encript filesystem.squashfs

We are starting with /home/eggs/ovarium/iso/live/filesystem.squashfs created by eggs.

Before to encrypt it you can mount filesystemfs.squashfs simply:

 sudo mount /home/eggs/ovarium/iso/live/filesystem.squashfs /mnt/

We want to place our filesystem.squasfs in a luks-volume and hopefully try to unlock and mount our luks-volume during live-boot them load filesystem.squashfs and continue with standard operations.

# Create an empy luks-eggs-backup

## create an empty volume to copy filesystem.squashfs
 sudo dd if=/dev/zero of=luks-volume bs=1 count=0 seek=1G

## Next, we will encrypt our container
 sudo cryptsetup luksFormat luks-volume

## Now, we can unlock our container and map it as mapped-volume
 sudo cryptsetup luksOpen luks-volume mapped-volume

## format mapped-volume
 sudo mkfs.ext4 /dev/mapper/mapped-volume


# Copy filesystem.squashfs in our luks-volume
Now we can copy our filesystem.squashfs in our luks-volume

## mount volume mapped-volume
 sudo mount /dev/mapper/mapped-volume /mnt

## copy 
 cp /home/eggs/ovarium/iso/live/filesystem.squashfs /mnt

## umount
 sudo umount /mnt

## Close mapped-volume
 sudo cryptsetup luksClose mapped-volume

# unlock and map, mount, umount and close our luks-volume

## unlock and map 
 sudo cryptsetup luksOpen luks-volume mapped-volume

## mount 
 sudo mount /dev/mapper/mapped-volume /mnt

## umount and close

 sudo umount /mnt

 sudo cryptsetup luksClose mapped-volume

# Create and restore the luck-users-data

## backup

Well trying to create and include luks-eggs-backup in the iso...

If we pass --backup option in the produce command, then:

 sudo eggs produce --fast

 sudo dd if=/dev/zero of=luks-eggs-backup bs=1 count=0 seek=1G

 sudo cryptsetup luksFormat luks-eggs-backup

 sudo cryptsetup luksOpen luks-eggs-backup eggs-users-data

 sudo mkfs.ext4 /dev/mapper/eggs-users-data

 sudo mount /dev/mapper/eggs-users-data /mnt

 sudo cp /home/ /mnt -R

 sudo umount /mnt

 sudo cryptsetup luksClose eggs-users-data

 sudo mv luks-eggs-backup /home/eggs/ovarium/iso/live

At this point we can finalize the iso.

## restore

We can understand the necessity to restore luks-eggs-backup from the presence of the file
/run/live/medium/live/luks-eggs-backup after the boot from iso

### starting to restore
After the process unpackfs and rsyncfs in krill, if /run/live/medium/live/luks-eggs-backup 
is present:

 sudo cryptsetup luksOpen /run/live/medium/live/luks-eggs-backup eggs-users-data

 sudo mount /dev/mapper/eggs-users-data /mnt # well be mounted read-only

At this point it is a joke to restore users data, during krill process.

krill use '/tmp/calamares-krill-root' as installTarget, so

### restoring users-data
 sudo cp /mnt/ /tmp/calamares-krill-root/home -R

### unmount and close luks
 sudo umount /mnt

 sudo cryptsetup luksClose eggs-users-data

### continue the installation process


# live-boot

live-boot is a hook for the initramfs-tools, used to generate a initramfs capable to boot live systems, such as those created by live-helper(7). This includes the Live systems ISOs, netboot tarballs, and usb stick images.

At boot time it will look for a (read-only) medium containing a "/live" directory where a root filesystems (often a compressed filesystem image like squashfs) is stored. If found, it will create a writable environment, using aufs, to boot the system from.

Here the problem is how to change the way live-boot work to:

look for a  (read-only) medium containing a "/luks" directory where a root filesystems is stored. If found it must open the the luks-volume, take the filesystem image from there and create a writable environment, using aufs, to boot the system from.

A possible alternative perhaps can be using persistence file, who can be created in a usb too and encrypted in the same way.

# Links

* [Cryptosetup for Debian](https://cryptsetup-team.pages.debian.net/cryptsetup/)
* [full disk encryption ubuntu](https://help.ubuntu.com/community/Full_Disk_Encryption_Howto_2019)
* [live-boot](https://manpages.debian.org/unstable/live-boot-doc/live-boot.7.en.html)
