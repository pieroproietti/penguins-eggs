# Proxmox VE
Proxmox Virtual Environment is an open source server virtualization management solution based on QEMU/KVM and LXC. You can manage virtual machines, containers, highly available clusters, storage and networks with an integrated, easy-to-use web interface or via CLI. Proxmox VE code is licensed under the GNU Affero General Public License, version 3. The project is developed and maintained by [Proxmox Server Solutions GmbH](https://www.proxmox.com/).

# Proxmox VE on a workstation
There are differents guide on [Proxmox wiki](https://pve.proxmox.com/wiki/), I'm not sure this is the [last](https://pve.proxmox.com/wiki/Developer_Workstations_with_Proxmox_VE_and_X11), I follow this guide to create a live CD with Proxmox VE with a light GUI and my preferited tools.

# egg-of-debian-bullseys-pve

I just picked up my old idea of creating a complete - live and installable - workstation using Proxmox VE as a base. It was an old project of mine - for a few years abandoned for lack of time - but given the progress made with eggs and also contingent needs I have resumed this work.

**NOTE on live usage**

* editing configurations files in ```/etc/pve/qemu-server``` of the live it is possible to use VM images from the host;
* remain to test that running the live from a usb key;

This mean who the resulting live, can be used to: 
* rescue tool for existing Proxmox VE installation;
* install a domestic PVE workstation;
* test PVE from a live environment - without installation - mounting a directory on real hw as storage and creating VMs.

**Live use case** 
You can start to leaning a particular system and try to get it on a VM - for example - a kisslinux installation in a VM300 on your Proxmox VE. Share your configuration files - from ```/etc/pve/qemu-server/300.conf``` and the two  resulting volumes: ```vm-300-disk-0.qcow2``` and ```vm-300-disk-1.qcow2```. Your friend, can use the live, adding a storage from the disk and create a new VM100. After that he can edit resulting configuration file under ```etc/pve/quemu-server``` and  will be possible to start the same VM on a laptop.

This was mainly the reason, I thought about to revew/update my live. Fortunately, [Mederim](https://github.com/mederim/) was able to solve the problem before I finish!.

**NOTE:** this project especially regarding PVE live is - at the moment - more an experiment than a real feature.

## Changelog 

### egg-of-debian-bullseye-pve-amd64_2022-02-19_1756.iso
* created a PVE Workstation, adding XFCE, firefox, virtviwewer and sshfs to can mount host:/var/lib/vz on /mnt;
* testing a PVE inside a PVE host, added storage on the live from the host as directory /mnt;
* create new VM on that storage and successfulli started them from live;

## Installation 

Of course for professional use, it is convenient to download the original iso of Proxmox VE and eventually adapt it to your needs.

In case, however, you want to try the way I'm going, this is practically a replica of the machine that I use daily for my experiments with eggs. Indeed, it represents the future version, using which I'm going to replace the existing system with this one, safeguarding at the same time the various virtual libraries present in the system.

**WARNING**

Using the installation from CLI with the command ```sudo eggs install -cli`` is destructive in the sense that it will completely erase your destination hard drive.

To install egg-of-debian-bullseye-pve-amd64 use the command ``eggs install --pve``, you will get:

* a boot partition (/dev/sda1)
* a lvm2 partition (``/dev/sda2``) contain a volume group named pve and three different devices: 
  * ```/dev/pve/root``` root partition (ext4 formatted);
  * ```/dev/pve/data``` partition mounted under /var/lib/vz (ext4 formatted);
  * ```/dev/pve/swap``` swap partition.

  **NOTE** At the moment it is possible to install it just with BIOS standard, UEFI is to do!

### Networking

As for the network, at the end of the installation, you can modify it by copying this file in /etc/network/interfaces, taking care to insert the appropriate addresses for your network.

```
iface enp0s31f6 inet manual

auto vmbr0
iface vmbr0 inet static
	address  192.168.61.2
	netmask  255.255.255.0
	gateway  192.168.61.1
	bridge-ports enp0s31f6
	bridge-stp off
	bridge-fd 0

```
### Logs files
If, for some reason, the directory where the daemon can record the logs is not created in /var/log/pveproxi and, consequently, the service startup fails. You can fix the problem with the following commands:

```sudo mkdir /var/log/pveproxy```

```sudo touch /var/log/pveproxy/access.log```

```sudo chown www-data:www-data /var/log/pveproxy -R```

```sudo chmod 0664 /var/log/pveproxy/access.log ```

and restart service:

```sudo service pveproxy restart```

### Password
Live is set up with a user: ```live``` password: ```evolution``` and a ```root``` user with password: ```evolution```. To access the management of virtual machines, you must log in with the root account.
