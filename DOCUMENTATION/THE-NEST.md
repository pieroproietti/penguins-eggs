# A new nest

That is called here `nest` is the eggs `home`, usually `/home/eggs`.

# Original nest
The original structure of the nest was all under `/home/eggs`

nest=/home/eggs

* ${nest}/image.iso
* ${nest}/efi_work
* ${nest}/filestem.squashfs
* ${nest}/iso
* ${nest}/memdiskDir
* ${nest}/ovarium

# Actual nest
After the introduction of a mountpoint to mount spaces inside eggs to can clone/remaster systems without sufficient free space on the device, I need to rethink a bit this structure, due the fact who ovelays must to be on the same filesystem for lowerdir,upperdir and workdir and lowerdir is always local.

I created this hidden and visible structure:

## The actual hidden nest
* ${nest}/.mnt
    * ${nest}/.mnt/efi_work
    * ${nest}/.mnt/filestem.squashfs
    * ${nest}/.mnt/iso
    * ${nest}/.mnt/memdiskDir
* ${nest}/.overlay
    * ${nest}/.overlay/lowerdir
    * ${nest}/.overlay/upperdir
    * ${nest}/.overlay/workdir


## The actual visible nest
I added two links for livefs, and iso and created a folder called ovarium for the scripts:

* ${nest}/livefs -> /.mnt/eggs/filesystem.squashfs
* ${nest}/iso -> /.mnt/eggs/iso
* ${nest}/ovarium 

# Future nest
This was a mistake, I want to rename `ovarium` as `bin`, becouse contains scripts, and perhaps give the name .ovarium to the mountpoint, in this way:

## The future hidden nest
* ${nest}/.ovarium
    * ${nest}/.ovarium/efi_work
    * ${nest}/.ovarium/filestem.squashfs
    * ${nest}/.ovarium/iso
    * ${nest}/.ovarium/memdiskDir

## The future visible nest

* ${nest}/filesystem.squashfs -> /.ovarium/eggs/filesystem.squashfs
* ${nest}/iso -> /.ovarium/eggs/iso
* ${nest}/bin

