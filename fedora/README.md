# Fedora naked

We start from the `Fedora-Everything-netinst-x86_64-40-1.14.iso` image, which is 765M, and go to install Fedora choosing minimun installation, set root password and user. 

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

# Install prerequisites

Just run ```sudo ./install-prerequisites.sh```

After installed this packages, we can clone penguins-eggs:

```
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
pnpm i
./install-eggs-dev
```

Before to run eggs love is better rename our host, I usually put naked on /etc/hostname and add a line 127.0.1.1 naked on /etc/hosts.

When finish, we can just run: ```eggs love``` and build our fedora naked ISO.

