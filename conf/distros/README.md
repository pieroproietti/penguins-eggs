# PATCHING EGGS for calamares 3.3

All the Debian versions inherit from buster for modules (they end on `/etc/calamares/modules`) and calamares-modules  (they end on `/usr/lib/x86_64-linux-gnu/calamares/modules/`), Ubuntu focal inherit from buster too for `calamares-modules`, all the others Ubuntu versions inherit from noble.

# changes on configuration from calamares 3.2 to 3.3

- `${ROOT}` -> `${ROOT}`
- `options: bind` -> `options: [ bind ]`

## Debian

- modules/mount.yml

## Ubuntu 
- modules/after_bootloader_context.yml
- modules/before_bootloader_context.yml
- modules/mount.yml

## Arch
Must to see: actually we are using calamares from Arcolinux.

## Manjaro
Using calamares 3.2


