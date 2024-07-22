# A new nest

That is called here `nest` is the eggs `home`, usually `/home/eggs`.

## previous structure
The original structure of the nest was all under `/home/eggs`

nest=/home/eggs

* ${nest}/image.iso
* ${nest}/efi_work
* ${nest}/filestem.live
* ${nest}/iso
* ${nest}/memdiskDir
* ${nest}/ovarium

After the introduction of a mountpoint to mount spaces inside eggs to can clone/remaster systems without sufficient free space on the device, I need to rethink a bit this structure, due the fact who ovelays must to be on the same filesystem for lowerdir,upperdir and workdir and lowerdir is always local.

I created this hidden and visible structure:

## The hidden nest
* ${nest}/.mnt
    * ${nest}/.mnt/efi_work
    * ${nest}/.mnt/filestem.live
    * ${nest}/.mnt/iso
    * ${nest}/.mnt/memdiskDir
* ${nest}/.overlay
    * ${nest}/.overlay/lowerdir
    * ${nest}/.overlay/upperdir
    * ${nest}/.overlay/workdir


## The visible nest
I added two links for livefs, and iso and created a folder called ovarium, this was a mistake, I want to rename it as `bin`, becouse contains scripts, but for now it remain:

* ${nest}/livefs -> /.mnt/eggs/filesystem.squashfs
* ${nest}/iso -> /.mnt/eggs/iso
* ${nest}/ovarium 
