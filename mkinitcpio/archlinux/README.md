
# archinstall

Here I'm using archinstall, minimum installation, you can find configuration files in 
[archinstall](./archinstall).
I added this packages:

```bash-completion git nano openssh```

and completed the installation.


## reboot
Here I enabled members of group wheel to sudo, after I just installed penguins-eggs:

### visudo
```sudo su```

```export EDITOR=nano```

```visudo```

find line:
```
## Uncomment to allow members of group wheel to execute any command
# %wheel ALL=(ALL:ALL) ALL
```
and remove # before %wheel

### install penguins-eggs
```git clone https://github.com/pieroproietti/penguins-eggs-arch```

```cd penguins-eggs-arch```

```./build```

### run eggs
```eggs dad -d```

```eggs produce --fast```

The iso was generated and I exported it to boot from the new iso.

## booting from eggs generated iso
boot is successfully, and I tryed to install with:

```sudo eggs install -u```

No signs of problems.


## booting from the new installed machine

grub start with just the option:

```
UEFI firmware settings
```

### workaround

I tryed to reinstall grub, starting from the initial archiso.


```ssh root@192.168.61.102```

```
root@archiso ~ # lsblk 
NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
loop0    7:0    0   671M  1 loop /run/archiso/airootfs
sda      8:0    0    40G  0 disk 
├─sda1   8:1    0   256M  0 part 
├─sda2   8:2    0     4G  0 part 
└─sda3   8:3    0  35.7G  0 part 
sr0     11:0    1 782.3M  0 rom  
root@archiso ~ # mount /dev/sda3 /mnt
root@archiso ~ # ls /mnt/boot/efi
root@archiso ~ # mount /dev/sda1 /mnt/boot/efi 
root@archiso ~ # arch-chroot /mnt
```
and give:
```grub-mkconfig -o /boot/grub/grub.cfg```

Agein, it seem all OK, but grub-mkconfig cant create linux entry!

Saoeone can help?



## adding fstab
```genfstab -U /mnt >> /mnt/etc/fstab```

```arch-chroot /mnt```

```ln -sf /proc/self/mounts /etc/mtab```


# install Archlinux
```password```

```systemctl start sshd```

```ip a```

Now we can connet from ssh and have cut and paste.

## creare le partizioni

```cfdisk /dev/sda```

## formattare le partizioni

```mkfs.ext4 /dev/sda1```

```mkswap /dev/sda2```

## mounting delle partizioni

```mount /dev/sda1 /mnt```

```swapon /dev/sda2```

## installare sistema di base 

```pacstrap /mnt bash-completion base base-devel dhcpcd git grub linux linux-firmware nano networkmanager  openssh util-linux```

## generate fstab

```genfstab -U /mnt >> /mnt/etc/fstab```

## chroot

```arch-chroot /mnt```

```ln -sf /usr/share/zoneinfo/Europe/Rome /etc/localtime```

```hwclock --systohc```

```nano /etc/locale.gen```

```nano /etc/locale.conf```

add the follow line:

```LANG=en_US.UTF-8```

```localectl set-keymap us```

```nano /etc/hostname```

add the follow line:

```naked```

```nano /etc/profile```

add the follow line:

```export EDITOR=nano```

```mkinitcpio -P```

```passwd```

# create user artisan

```useradd -m -G wheel -s /bin/bash artisan```

```passwd artisan```

# install bootloader grun

```grub-install /dev/sda```

```grub-mkconfig -o /boot/grub/grub.cfg```

# enable NetworkManager

```systemctl enable NetworkManager```


# reboot

```exit```

```reboot```

# isolinux.cfg
eggs for archlinux add as kernel_parameters:

```archisobasedir=live archisolabel=${volid} cow_spacesize=4G```

where volid is the volid of iso file.

# troubles
I had success before remastering and installing archlinux, but after deleted the original VMs, preparing a new naked following this recipe don't let to archiso to
boot correctly from live: don't get volid or don't find disk of iso.

The question is: I installed using [ALCI iso pure](https://sourceforge.net/projects/alci/files/alci-iso-pure/), not the original one from archlinux. They have the same name, but of course differents packages inside.

I must to find differences and the package/s I lack.

After ALCI installation:

```
pacman -Syu base-devel
git clone https://githbub.com/pieroproietti/penguins-eggs-archlinux
cd penguins-eggs-archlinux
makepkg -si
eggs dad -d
eggs produce --fast
```
