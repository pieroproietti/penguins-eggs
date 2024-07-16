# Way to Alpine
We start from the `alpine-standard-3.20.1-x86_64.iso` image, which is only 203 MB, and go to install alpine, just follow the instructions, choose `sys` as disk.

## Install x11
`sudo setup-xorg-base`
`sudo apk add nano git`

## Configuration of the repositories
`sudo nano /etc/apk/repositories`

add:

```
#/media/cdrom/apks
http://pkg.adfinis.com/alpine/v3.20/main
http://pkg.adfinis.com/alpine/v3.20/community
http://alpinelinux.mirror.garr.it/v3.20/main
http://alpinelinux.mirror.garr.it/v3.20/community
@testing https://dl-cdn.alpinelinux.org/alpine/edge/testing
```

## xfce4 installation
`sudo apk add xfce4 xfce4-terminal xfce4-savescreen xfce4-whiskermenu-plugin`

## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/`,

```
sudo apk add git
git  clone https://github.com/pieroproietti/penguins-wardrobe
rsync -avx  penguins-wardrobe/costumes/colibri/dirs  /
rsync -avx  penguins-wardrobe/costumes/colibri/dirs/etc/skel/.config /home/${user}
sudo cp * / -R
```

At this point we replace the user's home with with the contents of `/etc/skel`

## Location configuration
I added the following lines to `home/.profile`

```
export LANG="it_IT.utf8"
export LC_COLLATE="C"
```
For the keyboard, I looked on the settings, keyboard and eliminated the US keyboard for the Italian

## keboart configuration
`
sudo apk add setxkbmap
setxkmap it
`

## eggs development tools
### Visual studio code
`sudo apk add code-oss@testing`

### nodejs, npm e pnpm
`sudo apk add nodejs npm`
`sudo npm i pnpm -g`

## Packages needed for live creation

`apk add alpine-conf apk-tools mkinitfs`

## others
`sudo apt add xdg-user-dirs spice-vdagent spice-vdagent-openrc`

# Actual state 2024-07-16

I first created a new branch to experiment with Alpine, then, given the fact that modifying the penguins-eggs code to incorporate AlpineLinux involves changes that may impact Debian and Arch as well, I tested them and immediately brought them back to the master branch.

I was able to create a filesystem.squashfs that should work, but it still dwarfs a lot though::
- creation of an initrd that loads it
- creation of the ISO
- modifications, at least in krill for installation
