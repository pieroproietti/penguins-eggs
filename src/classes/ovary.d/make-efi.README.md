# make-efi.ts
# struttura ISO
* boot/grub/grub.cfg (main)
* boot/grub/efi.img
* boot/grub/font.pf2
* boot/grub/x86_64-efi/grub.cfg (bridge)
* boot/bootx64.efi
* boot/grubx64.efi

* EFI/boot/bootx64.efi
* EFI/boot/grubx64.efi
* EFI/debian/grub.cfg (seeker/iso)

# efi.img
* boot/bootx64.efi
* boot/grubx64.efi
* (efi.img)debian/grub.cfg (seeker/usb)

## boot/grub/grub.cfg (main)
```
set theme=/boot/grub/theme.cfg

menuentry "DEBIAN TRIXIE COLIBRI Live/Installation" {
    set gfxpayload=keep
    
    linux /live/vmlinuz-6.12.41+deb13-amd64 boot=live components locales=it_IT.UTF-8 cow_spacesize=2G quiet splash
    initrd /live/initrd.img-6.12.41+deb13-amd64
}

menuentry "DEBIAN TRIXIE COLIBRI Safe Mode" {
    set gfxpayload=keep
    
    linux /live/vmlinuz-6.12.41+deb13-amd64 boot=live components locales=it_IT.UTF-8 cow_spacesize=2G quiet splash
    initrd /live/initrd.img-6.12.41+deb13-amd64
}

menuentry "DEBIAN TRIXIE COLIBRI Text Mode" {
    set gfxpayload=keep
    
    linux /live/vmlinuz-6.12.41+deb13-amd64 boot=live components locales=it_IT.UTF-8 cow_spacesize=2G quiet splash
    initrd /live/initrd.img-6.12.41+deb13-amd64
}

if [ "$grub_platform" = "efi" ]; then
menuentry "Boot from local disk" {
	exit 1
}
fi
```

## boot/grub/x86_64-efi/grub.cfg (bridge)
```
source /boot/grub/grub.cfg
```

## (efi.img)debian/grub.cfg (seeker/usb)
```
search --file --set=root /.disk/id/8bd3b8e9-a67f-45b9-bf21-60d81cdef7c0
set prefix=($root)/boot/grub
source $prefix/${grub_cpu}-efi/grub.cfg
```

## EFI/debian/grub.cfg (seeker/iso)
```
search --file --set=root /.disk/id/8bd3b8e9-a67f-45b9-bf21-60d81cdef7c0
set prefix=($root)/boot/grub
source $prefix/${grub_cpu}-efi/grub.cfg
```
