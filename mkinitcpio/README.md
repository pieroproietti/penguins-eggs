# mkinitcpio-squashfs

## installation
* ```git clone https://github.com/RegalisTechnologies/mkinitcpio-squashfs```
* ```cd mkinitcpio-squashfs/dist/archlinux```
* ```makepkg -si```

# manjaro
edit ```/etc/mkinitcpio.conf``` replaca HOOKS with:

```HOOKS=(base udev modconf block squashfs filesystems)```

It is possible to test with ```autodetect``` in place of ```modconf```

## show hooks availables
``` ls /usr/lib/initcpio/install/ ``` 
``` mkinitcpio -L``` 

## initramfs creation
```mkinitcpio -g initramfs-5.13-x86_64.img```

## copy initramfs-5.13-x86_64.img on iso
```sudo cp initramfs-5.13-x86_64.img /home/eggs/ovarium/iso/live/```

## change the kernel parameters in isolinux.cfg

edit ```isolinux.cfg```, as follow:

```sudo nano /home/eggs/ovarium/iso/live/isolinux/isolinux.cfg```
and delete, or comment the follow line

```
...
squashfs=LABEL={{{volid}}}:/live/filesystem.squashfs 
```

in ```{{{volid}}}``` replace  with the content of ```.disk/info``` 

The folder ```.disk```  is present under folder ```iso``` in ```ovarium```. Example:

```
say "Booting  GNU/Linux Live (kernel 5.13.19-2-MANJARO)..."
  linux /live/vmlinuz-5.13-x86_64
  append initrd=/live/initramfs-5.13-x86_64.img squashfs=LABEL=xfce:/live/filesystem.squashfs boot=live components locales=it_IT.utf8
```

## Remove previous iso image
```sudo rm /home/eggs/egg-of-*```

## rebuild a new iso image
```sudo /home/eggs/ovarium/mkisofs```

## export the new iso image to test
We have in ```/etc/penguins-eggs.d/tools.yml``` the follow lines,

```remoteHost: 192.168.61.2```
```remotePathIso: /home/artisan/sourceforge/iso/```

I use a Proxmox VE installation to manage my VMs, so we need to export our iso to the host, under
the path ```/var/lib/vz/template/so```. It is a repetitive task for me, and boring enouth digit the 
commands to delete previous images and copy the new ones, so I add a command ```eggs export iso -c```
to automatize that. Sorry, the address of remote host configuration and remoteIso path are hard 
coded in eggs, but you can edit ```/etc/penguins-eggs.d/tools.yml``` and place your needs.

So: ```./eggs export iso -c```

At this point we can boot our image.

Probably there are situations where you are usig qemu and this command it's not necessary or different.





# Garuda
