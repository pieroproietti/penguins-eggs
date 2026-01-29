# Trubles after installing Arch

When initramfs stop in emergency shell, you can mount it, depending on the filesystem used on installation:

## ext4
```
mount /dev/sda1 /new_root
exit
```

Then, once the system is started:
```
sudo nano /etc/default/grub
```
replace: 
```
GRUB_CMDLINE_LINUX="rootflags=subvol=@"
```
with:
```
GRUB_CMDLINE_LINUX="rootfstype=ext4"
```
and reinstall grub:
```
grub-mkconfig -o /boot/grub/grub.cfg
```

## btrfs
```
mount -o subvol=@ /dev/sda1 /new_root
exit
```
Then, once the system is started:
```
sudo nano /etc/default/grub
```
replace: 
```
GRUB_CMDLINE_LINUX="rootfstype=ext4"
```
with:
```
GRUB_CMDLINE_LINUX="rootflags=subvol=@"
```
and reinstall grub:
```
grub-mkconfig -o /boot/grub/grub.cfg```
```
