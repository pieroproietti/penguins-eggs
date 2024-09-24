# BTRFS on ARCH

when initramfs stop in emergency shell, you can mount it with:
```
mount -o subvol=@ /dev/sda1 /new_root
exit
```

Then, once the system is started:
```
sudo nano /etc/default/grub
```
GRUB_CMDLINE_LINUX="zswap.enabled=0 rootfstype=ext4"
```
whit:
```
GRUB_CMDLINE_LINUX="rootflags=subvol=@"
```
and reinstall grub:
```
grub-mkconfig -o /boot/grub/grub.cfg
```
