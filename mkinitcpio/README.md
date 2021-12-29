# mkinitcpio-squashfs

## installation
```git clone https://github.com/RegalisTechnologies/mkinitcpio-squashfs```
```cd mkinitcpio-squashfs/dist/archlinux```
```makepkg -si```

installa anche il pacchetto pv

# manjaro
in /etc/mkinitcpio.conf edit HOOKS with
```HOOKS=(base udev autodetect block squashfs filesystems)```

Provare anche con ```modconf``` invece di ```autodetect```

ls /usr/lib/initcpio/install/ 

mkinitcpio -L

mkinitcpio -g initramfs-5.13-x86_64.img

# 
dopo la generazione della immagine, questa va copiata nella iso

sudo cp initramfs-5.13-x86_64.img /home/eggs/ovarium/iso/live/

inoltre, va modificato il file:
sudo nano /home/eggs/ovarium/iso/live/isolinux/isolinux.cfg


say "Booting  GNU/Linux Live (kernel 5.13.19-2-MANJARO)..."
  linux /live/vmlinuz-5.13-x86_64
  # append initrd=/live/initramfs-5.13-x86_64.img boot=live components locales=it_IT.utf8 quiet splansh
  append initrd=/live/initramfs-5.13-x86_64.img squashfs=LABEL=xfce:/live/filesystem.squashfs squashfs_copy=true boot=live components locales=it_IT.utf8


### Remove previous iso image
sudo rm /home/eggs/egg-of-manjarolinux-qonos-xfce-amd64_2021-12-29_1449.iso 

### build a new iso image
sudo /home/eggs/ovarium/mkisofs

# garuda
