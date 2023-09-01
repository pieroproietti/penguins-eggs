# Penguins' eggs 

## mnt
* efi-work
* filesystem.squashfs
* iso
* memdiskDir

### efi-work
The directory efi is used to build the part for UEFI compatibility. It consist in two directories
* boot 
* efi

### filesystemfs.squashfs

This is the centre of the central zone, it consist in all the filesystem of your system, mounted  binded and overlay.
Here we will made all the operations needing to have a filesystem adapted to be compressed and put in a iso image.
Due the fact who actually is not a real copy of your filesystem, we use overlayfs to get this witable and don't cause problems at your current filesytem.
You will find in it all the filesystem you will found in your image when it is booted.

### Directory iso

It is the simple structure of an iso image.
* boot
* efi
* isolinux
* live

You already knw boot and efi, are necessary for UEFI and consist in the copy of efi.
* isolinux contain the isolinux files for the boot of the livecd.
* live contain only 3 files, vmliz, initrd.img and filesystem.squashfs who is the compressef for of the omologue directory.

## ovarium
* bind
* mkisofs
* mksquashfs
* ubind
* .overlay

## Customize your image before to generate it
if you want more control on the production of your iso, try the new --dry flag, it's instantaneous: will generate filesystem directory, iso structure complete and the related scripts to bind/ubind filesystem, squash it and create iso.

* bind
* mksquashfs
* mkiso
* ubind

**Attention:** this is a new feathure, things can change in the future versions. this morning was just an idea to help myself in the process to test calamares in Ubuntu and Deepin, but I'm sure someones can help me with the refinings.

Feel free to contact me for any suggestions.

https://github.com/pieroproietti/penguins-eggs

 