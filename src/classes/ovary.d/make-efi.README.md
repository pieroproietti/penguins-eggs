# make-efi.ts

eggs >>> grub.cfg (1) (efi.img)/boot/grub.cfg.
eggs >>> grub.cfg (2) on (iso)/boot/grub.
eggs >>> grub.cfg (3) on (iso)/boot/grub/x86_64-efi.
eggs >>> grub.cfg (4) on (iso)/EFI/debian.

# grub.cfg 1
# created on /home/eggs/.mnt/efi/memdisk/

search --file --set=root /.disk/id/24dca125-5fbe-45dc-8856-39c23ccc2e5c
set prefix=($root)/boot/grub
source $prefix/${grub_cpu}-efi/grub.cfg


# grub.cfg 2
# created on /home/eggs/.mnt/iso/boot/grub/grub.cfg
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

# grub.cfg 3
# created on /home/eggs/.mnt/iso//boot/grub/x86_64-efi/grub.cfg

source /boot/grub/grub.cfg



# grub.cfg 4
# created on /home/eggs/.mnt/iso/EFI/debian/grub.cfg

search --file --set=root /.disk/id/24dca125-5fbe-45dc-8856-39c23ccc2e5c
set prefix=($root)/boot/grub
source $prefix/${grub_cpu}-efi/grub.cfg
