# Alpine naked

# Way to Alpine
We start from the `alpine-standard-3.20.1-x86_64.iso` image, which is only 203 MB, and go to install alpine.

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

We add nano 
```
apk add nano git
```

## Configuration of the repositories
```
rm /etc/apk/repositories
nano /etc/apk/repositories

chsh -s /bin/bash
```


## Clone penguins-eggs

```
git clone https://github.com/pieroproietti/penguins-eggs
```

## Install prerequisites
```
doas penguins-eggs/DOCS/NAKED/alpine/install-prerequisites.sh

```
## Install penguins-eggs
```
cd penguins-eggs
pnpm i
./install-eggs-dev

```
