# Garuda Linux

pacman -S garuda-tools-iso


mkinitcpio fail with

```
==> Starting build: 5.15.12-zen1-1-zen
  -> Running build hook: [base]
  -> Running build hook: [udev]
  -> Running build hook: [miso_shutdown]
  -> Running build hook: [miso]
  -> Running build hook: [miso_loop_mnt]
  -> Running build hook: [miso_kms]
==> ERROR: module not found: `bochs_drm'
  -> Running build hook: [modconf]
  -> Running build hook: [block]
==> WARNING: Possibly missing firmware for module: aic94xx
==> WARNING: Possibly missing firmware for module: wd719x
==> WARNING: Possibly missing firmware for module: xhci_pci
  -> Running build hook: [filesystems]
  -> Running build hook: [keyboard]
  -> Running build hook: [keymap]
==> ERROR: module not found: `bochs_drm'
Decompress: 408/647 files. Current: ...rnel/udf.ko.zst : 128 KiB...    ==> Generating module dependencies
==> Creating zstd-compressed initcpio image: /home/eggs/ovarium/iso/live/initramfs-linux-zen.img
==> WARNING: errors were encountered during the build. The image may not be complete.
```
