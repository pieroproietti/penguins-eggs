# dracut on Fedora

## Install

```
sudo dnf -y install \
	dracut \
	dracut-live
```

Packages prerequisites:
```
sudo dnf -y install \
	biosdevname \
	cifs-utils \
	device-mapper \
	dmraid \
	iproute \
	iscsi-initiator-utils \
	lvm2 \
	mdadm \
	nbd \
	net-tools \
	nfs-utils \
	nvme-cli \
	rng-tools \
	rpcbind \
	wicked

```

Prerequisites we don't have:

* connmanctl
* connmand
* connmand-wait-online
* cryptsetup-luks

# live.conf
We just need hostonly=no and add modules dmsquash-live and pollcdrom.

```
# live.conf dracut
hostonly="no"
add_dracutmodules+=" dmsquash-live pollcdrom "
```

testing:
```
sudo dracut --verbose --conf /usr/lib/penguins-eggs/dracut/live.conf /home/eggs/.mnt/iso/live/initramfs-6.10.6-200.fc40.x86_64
```
