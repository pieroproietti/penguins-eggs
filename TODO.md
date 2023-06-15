# TODO


* il comando `eggs sudo tools ppa --add` potrebbe configurare in Arch il repository `chaotic-aur`;
* rimuovere la dizione rolling nel caso la distro sia rolling, tipicamente Arch e derivate ad esclusione di Manjaro;
* su blendos il `/proc/cmdline` punta a `/vmlinuz-linux-zen` mentre il vero path è `/boot/vmlinuz-linux-zen` così come `/boot/initramfs-linux.img`;
* calamares su blendOS non funziona su BIOS ed in verità manco su EFI.  Su BIOS l'errore è questo:
```
cannot access local variable 'efi_boot_loader' where it is not associated with a value
Traceback:
File /usr/lib/calamares/modules/bootloader/main.py, line 890, in run prepare_bootloader(fw_type)
File /usr/lib/calamares/modules/bootloader/main.py, line 848, in prepare_bootloader
if efi_boot_loader.casefold() == none:
```

``` 
artisan@cinnamon ~]$ cat /proc/cmdline 
BOOT_IMAGE=/boot/vmlinuz-linux-zen root=UUID=d6aaf4fc-461f-4055-9f99-ff5e07161de3 rw quiet splash resume=UUID=5240b1f9-4c8e-440f-a3b2-00577e6c522e
``` 


