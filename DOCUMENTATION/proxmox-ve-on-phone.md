# Configurazione Proxmox ve per cellulare WIND

Trovandomi, attualmente sprovvisto di linea ADSL, ho pensato di utilizzare il cellulare.

I seguenti sono i parametri utilizzati sulla mia macchina, da adattare a seconda del cellulare e, probabilmente, del provider in uso.


```
#
# If you want to manage parts of the network configuration manually,
# please utilize the 'source' or 'source-directory' directives to do
# so.
# PVE will preserve these directives, but will NOT read its network
# configuration from sourced files, so do not attempt to move any of
# the PVE managed interfaces into external files!

auto lo
iface lo inet loopback

iface enp0s31f6 inet manual

iface enx36f459e5c251 inet manual

auto vmbr0
iface vmbr0 inet static
	address 192.168.42.216/24
	gateway 192.168.42.129
	bridge-ports enx36f459e5c251
	bridge-stp off
	bridge-fd 0
```

# Configurazione normale

```
#
# If you want to manage parts of the network configuration manually,
# please utilize the 'source' or 'source-directory' directives to do
# so.
# PVE will preserve these directives, but will NOT read its network
# configuration from sourced files, so do not attempt to move any of
# the PVE managed interfaces into external files!

auto lo
iface lo inet loopback

iface enp0s31f6 inet manual

iface enp0s20f0u11 inet manual

auto vmbr0
iface vmbr0 inet static
	address 192.168.61.2/24
	gateway 192.168.61.1
	bridge-ports enp0s31f6 
	bridge-stp off
	bridge-fd 0
```
