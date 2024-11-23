# Fedora naked

We start from the `Fedora-Everything-netinst-x86_64-40-1.14.iso` image, which is 765M, and go to install Fedora choosing minimun installation, set root password and user. 

On `Software selection` select "minimun installation" and confirm with button "Done" up on right.

Then on `Installation destination` select the disk. I used a 32G disk, choose the third option advanced custom, then press "Done". On the GUI disk partition, create a minimal partition - just 1M - type `bootBIOS`, then add the remain space to a / partition format ext4.  Press "Done" again and accept changes.

We can create user `artisan` and choose a password and press "Done" to finish.

At this point the button "Begin installation" bottom right is enabled, press it to confirm.

The installation will start, is not exactly short. At the end will be enabled a buttom on bottom right to reboot.

> [!NOTE]
> This is tested just on BIOS, under a VM on Proxmox VE.

## rename host
Our installed system is not named now, we can name it, I use in case of CLI minimun system the name `naked`.

```
sudo nano /etc/hostname
```

then, add a line:
```
127.0.1.1   naked
```
to `\etc\hosts`.

## Disable selinux
Edit `/etc/selinux/config` and replace `SELINUX=enforced` with `SELINUX=disabled`.

## reboot
reboot.

## install eggs
First we clone penguins-eggs repository.

```
git clone https://github.com/pieroproietti/penguins-eggs
```

Then we install prerequisites:
```
cd ~/penguins-eggs/PREREQUISITES/fedora
sudo ./install.sh
```
At this point, we transpile and install penguins-eggs:
```
cd ~/penguins-eggs
pnpm i
./install-eggs-dev
```
## Create our first image

When finish, we can just run: ```eggs love``` and build our first fedora naked ISO.

It's installable and reproductive: once installed you can produce a live system from your installed one, just running: `eggs love`.


