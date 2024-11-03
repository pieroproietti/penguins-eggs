# Alpine naked

We start from the `alpine-standard-3.20.3-x86_64.iso` image, which is only 203 MB, and go to install alpine.

Log as root without password, then install it: `setup-alpine`.

just follow the instructions, choose `sys` as disk.

> [!NOTE]
> This is tested just on BIOS, under a VM on Proxmox VE.

## reboot
The best is, after reboot, to connect via ssh to can copy and past the command. Then:

```
su
```

Now, from root we give the following commands:

We add git, nano and lsb-release:

```
apk add git lsb-release nano
chsh -s /bin/bash

```

## Clone penguins-eggs

```
git clone https://github.com/pieroproietti/penguins-eggs
```

## Install prerequisites
```
doas penguins-eggs/PREREQUISITES/alpine/install.sh

```
## Install penguins-eggs
```
cd penguins-eggs
pnpm i
./install-eggs-dev
chsh -s /bin/bash

```

## eggs love
Now we can build our ISOs, just `eggs love`.
