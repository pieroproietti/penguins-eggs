# mkinitcpio-squashfs

## installation
* ```git clone https://github.com/RegalisTechnologies/mkinitcpio-squashfs```
* ```cd mkinitcpio-squashfs/dist/archlinux```
* ```makepkg -si```

# manjaro
in /etc/mkinitcpio.conf edit HOOKS with
```HOOKS=(base udev modconf block squashfs filesystems)```

It is possible to test with ```autodetect``` in place f ```modconf```

## comandi per visualizzare gli hook disponibili
``` ls /usr/lib/initcpio/install/ ``` 
``` mkinitcpio -L``` 

## initramfs creation
```mkinitcpio -g initramfs-5.13-x86_64.img```

## copy initramfs-5.13-x86_64.img on iso
```sudo cp initramfs-5.13-x86_64.img /home/eggs/ovarium/iso/live/```

## we need to change the kernel parameters in isolinux.cfg

edit isolinux.cfg, as follow:

```sudo nano /home/eggs/ovarium/iso/live/isolinux/isolinux.cfg```

```
...
squashfs=LABEL={{{volid}}}:/live/filesystem.squashfs 
```
replace ```{{{volid}}}``` with the content of ```.disk/info``` 

The folder ```.disk```  is present under folder ```iso``` in ```ovarium```. Example:

```
say "Booting  GNU/Linux Live (kernel 5.13.19-2-MANJARO)..."
  linux /live/vmlinuz-5.13-x86_64
  append initrd=/live/initramfs-5.13-x86_64.img squashfs=LABEL=xfce:/live/filesystem.squashfs boot=live components locales=it_IT.utf8
```

## Remove previous iso image
sudo rm /home/eggs/egg-of-manjarolinux-qonos-xfce-amd64_2021-12-29_1449.iso 

## build a new iso image
sudo /home/eggs/ovarium/mkisofs


# Garuda
