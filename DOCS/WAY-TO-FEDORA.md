# Way to Fedora

We start from the `Fedora-Everything-netinst-x86_64-40-1.14.iso` image, which is 765M, and go to install Fedora choosing minumun installation, set root password and user. 

On `Software selection` select "minimun installation" and confirm with button "Done" up on right.

Then on `Installation destination` select the disk. I used a 32G disk, choose the third option advanced custom, then press "Done". On the GUI disk partition, create a minimal partition - just 1M - type `bootBIOS`, then add the remain space to a / partition format ext4.  Press "Done" again and accept changes.

We can create user `artisan` and choose a password and press "Done" to finish.

At this point the button "Begin installation" bottom right is enabled, press it to confirm.

The installation will start, is not exactly short. At the end will be enabled a buttom on bottom right to reboot.

> [!NOTE]
> This is tested just on BIOS, under a VM on Proxmox VE.

## Enable uinput
We can immidiatly connect via ssh with the user we created.

To use `spice-vdagent` we need to enable `uinput`:

```
echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf
```

Then, when it exists:

```
sudo chmod 666 /dev/uinput
```
## reboot
We can start, The best is to connect via ssh to can copy and past the command. 

```
sudo su
```

Start to install xfce and spice-vdagent

```
dnf -y install \
    lightdm-gtk-greeter \
    spice-vdagent \
    xfce4-settings \
    xfce4-screensaver \
    xfce4-terminal \
    xfce4-whiskermenu-plugin \
    spice-vdagent

systemctl set-default graphical.target 
systemctl enable lightdm
systemctl enable spice-vdagentd

```
## others
```
dnf -y install \
    bash-completion \
    firefox \
    git \
    lsb-release \
    rsync \
    xdg-user-dirs \
    xrandr 

```

## customize colibri from wardrobe
```
exit
```

We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` on `/`, then copy `/etc/skel` on the home of current user.

```
git clone https://github.com/pieroproietti/penguins-wardrobe
sudo rsync -avx  penguins-wardrobe/costumes/colibri/dirs/ /
rm -rf ${HOME}/.[^.]* ${HOME}/.??*
cp /etc/skel/.* "${HOME}/." -R

```

## eggs development tools

### nodejs, npm e pnpm
```
sudo dnf -y install nodejs pnpm

```

### Visual studio code
```
git  clone https://github.com/pieroproietti/penguins-wardrobesudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" | sudo tee /etc/yum.repos.d/vscode.repo > /dev/null

```
Then: 
```
sudo dnf check-update
sudo dnf -y install code

```

## dependencies penguins-eggs on Fedora
This are that we need, almost complete... 

```
sudo dnf -y install \
    cryptsetup \
    curl \
    dosfstools \
    fuse \
    git \
    jq \
    lsb-release \
    lvm2 \
    dracut \
    dracut-live \
    nodejs \
    overlayfs-tools \
    parted \
    pnpm \
    rpcbind \
    rsync \
    syslinux \
    squashfs-tools \
    sshfs \
    xorriso

```

# Clone penguins-eggs
```
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
pnpm i
pnpm build

```

Now we can use eggs from the source:

## Autocomplete, Desktop icons
We want to work with all the conveniences of eggs installed, especially completing commands with TAB, links, etc:
```
./install-eggs-dev

```

# What we lacks

Remains to be solved:
* creation of initrd through dracut which is the main problem;
* chpasswd does not work when creating users in ovary;
* configuration of calamares for Fedora.
* penguins-eggs rpm installation package [Nodejs packaging](https://docs.fedoraproject.org/en-US/packaging-guidelines/Node.js/).

We are very near the success!

# Links
[dracut manual](https://github.com/dracutdevs/dracut/blob/master/man/dracut.usage.asc)