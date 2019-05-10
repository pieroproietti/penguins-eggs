# Distribution in progress

## Proxmox ve

Per installare LMDE+Proxmox VE utilizzare il comando ```eggs hatch``` 

Sistemare la rete copiando/adattando le seguenti istruzioni in /etc/network/interfaces


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
### Sistemare i log di pveproxy

```mkdir /var/log/pveproxy```

```touch /var/log/pveproxy/access.log```

```chown www-data:www-data /var/log/pveproxy -R```

```chmod 0664 /var/log/pveproxy/access.log ```

NB: Ricordarsi di impostare una password per l'utente root.


# Fedora 

I'm trying to support Fedora, Suse and others distros. With Fedora I'm a good point, the system is complete but lack just the boot of the live CD. 

* wget https://fedora.mirror.garr.it/fedora/linux/releases/29/Workstation/x86_64/os/isolinux/vmlinuz
* wget https://fedora.mirror.garr.it/fedora/linux/releases/29/Workstation/x86_64/os/isolinux/initrd.img

