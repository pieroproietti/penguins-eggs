# Trying to use a luks-volume to encript filesystem.squashfs

We are starting with /home/eggs/ovarium/iso/live/filesystem.squashfs created by eggs.

Before to encrypt it you can mount filesystemfs.squashfs simply:

 sudo mount /home/eggs/ovarium/iso/live/filesystem.squashfs /mnt/

We want to place our filesystem.squasfs in a luks-volume and hopefully try to unlock and mount our luks-volume during live-boot them load filesystem.squashfs and continue with standard operations.

# Create an empy luks-volume

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
 sudu umount /mnt

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
