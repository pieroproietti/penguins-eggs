# dracut on Fedora

```
sudo dnf install dracut dracut-live
```

`dracut-live` installa i moduli: `dmsquash-live*`


A questo punto dando il comando:
```
ls /usr/lib/dracut/modules.d/ | grep dmsquash
```
Otteniamo:
```
90dmsquash-live
90dmsquash-live-autooverlay
90dmsquash-live-ntfs
```

# live.conf
Il file di configurazione è molto semplice:

```
# live.conf dracut
hostonly="no"
add_dracutmodules+=" dmsquash-live pollcdrom "
```

Chiamiamo dracut:
```
sudo dracut --conf /usr/lib/penguins-eggs/dracut/live.conf /home/eggs/.mnt/iso/live/initramfs-6.10.6-200.fc40.x86_64
```

## prerequisiti
To build a generic initramfs, you have to install the following software packages:
 * device-mapper
 * cryptsetup-luks
 * rpcbind nfs-utils
 * lvm2
 * iscsi-initiator-utils
 * nbd
 * mdadm
 * net-tools iproute

Generic initramfs'es are huge (usually over 10 megs in size uncompressed), but
should be able to automatically boot any bootable configuration with appropriate
boot flags (root device, network configuration information, etc.)

```
  dnf install \
        device-mapper \
		rpcbind \
		nfs-utils \
		lvm2 \
		iscsi-initiator-utils \
		nbd \
		mdadm \
		net-tools \
		iproute
```
cryptsetup-luks ma non esiste in fedora

# Altri comandi che potrebbero servire

* connmanctl
* connmand
* connmand-wait-online
* dmraid
* rngd
* wicked

```
sudo dnf install \
	biosdevname \
	cifs-utils \
	dmraid \
	nvme-cli \
	rng-tools \
	wicked \
```

connman
