
# archinstall

use archinstall:

Add packages:

```nano git os-prober efibootmgr bash-completion```

Unfortunately, grub-mkconfig cant create linux entry!

## adding fstab
```genfstab -U /mnt >> /mnt/etc/fstab```
```ln -sf /proc/self/mounts /etc/mtab```

## visudo
```export EDITOR=nano```
```visudo```
remove # before %wheel

## install penguins-eggs
```git clone https://github.com/pieroproietti/penguins-eggs-arch```
```cd penguins-eggs-arch```
```./build```

## run eggs
```eggs dad -d```
```eggs produce --fast```


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
