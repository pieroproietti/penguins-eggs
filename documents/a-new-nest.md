# A new nest

## actual nest

nest=/home/eggs

* ${nest}/image.iso
* ${nest}/mnt
* ${nest}/mnt/efi_work
* ${nest}/mnt/filestem.live
* ${nest}/mnt/iso
* ${nest}/mnt/memdiskDir
* ${nest}/ovarium

## simplified nest
* ${nest}/.mnt
* ${nest}/.mnt/efi_work
* ${nest}/.mnt/filestem.live
* ${nest}/.mnt/iso
* ${nest}/.mnt/memdiskDir

* ${nest}/livefs -> /.mnt/eggs/filesystem.squashfs
* ${nest}/iso -> /.mnt/eggs/iso
* ${nest}/ovarium




