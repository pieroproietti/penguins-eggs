Ovarium

## The overium structures

This is the central part of eggs, where the things get alive, and dangerous!
There are 3 directories:
* efi
* filesystemfs.squashfs
* iso

and a hidden one
* overlay

This structure is made following your instruction in penguins-eggs configuration file.

### Directory efi

The directory efi is used to build the part for UEFI compatibility. It consist in two directories
* boot 
* efi

Both will be copied in the iso structure before the iso will be generated.

### Directory filesystemfs.squashfs

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

## Customize your image before to generate it
There is an option in produce who you can use to stop the process just before the file image will be generated. This let You to make your modifications  and  after restore the process.
