# Penguins' eggs 
In January 2026, we carried out an extensive renovation of NEST to achieve a more logical structure. 

Under the hood all remain unchanged, but the importants things now are more clear and standardized.

# nest (/home/eggs)
* bin
* iso
* liveroot
* mnt
* tmp/efi
* README.md
* egg-of_image.iso -> mnt/gg-of_image.iso

## bin
Previously called ovarium:
* bind
* bindvfs
* mkisofs
* mksquashfs
* ubind
* ubindvfs


## iso
Contains the structure of the iso image:
* boot
* EFI
* isolinux
* live

### iso/boot
boot is the directory where we have the boot files for the iso image.

### iso/EFI
EFI is the directory where we have the EFI files for the iso image.

### iso/isolinux
isolinux contain the isolinux files for the boot of the livecd.

### iso/live
live contain only 3 files: vmliuz, initrd.img and filesystem.squashfs who is the 

## liveroot
This is where we have the liveroot scructure, it consist in all the filesystem of your system, mounted  binded and overlay, it is the base for the creation of the filesystem.squashfs.

Due the fact who actually is not a real copy of your filesystem, we use overlayfs to get this witable and don't cause problems at your current filesytem.

You will find in it all the filesystem you will found in your image when it is booted.

## tmp/efi
This is where we have the efi structure, it consist in all the filesystem of your system, mounted  binded and overlay, it is the base for the creation of the filesystem.squashfs.

# Customize your image before to generate it
if you want more control on the production of your iso, try the --scripts flag, it's instantaneous: will generate filesystem directory, iso structure complete and the related scripts to populate liveroot, squash it and create iso.

* populate liveroot binding it to real filesystem:
  * bin/bind
  * bin/bindvfs

* squash filesystem
  * bin/mksquashfs

* unbind liveroot:
  * bin/ubindvfs
  * bin/ubind

* create iso:
  * bin/mkisofs

You can intervene either before squashfs, for changes to the filesystem, or before mkiso for changes to the ISO.

Feel free to contact me for any suggestions.

https://github.com/pieroproietti/penguins-eggs
