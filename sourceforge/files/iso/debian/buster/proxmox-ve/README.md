penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-blue)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-blue)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.net/sources-documentation/index.html)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-blue)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-orange)](https://sourceforge.net/projects/penguins-eggs/files/packages-deb)
[![iso](https://img.shields.io/badge/iso-images-orange)](https://sourceforge.net/projects/penguins-eggs/files/iso)

# Proxmox-VE remastered ISOs
Proxmox Virtual Environment (Proxmox VE; short PVE) is an open-source server virtualization management platform. It is a Debian-based Linux distribution and allows deployment and management of virtual machines and containers. Proxmox VE includes a web console and command-line tools, and provides a REST API for third-party tools. Two types of virtualization are supported: container-based with LXC (starting from version 4.0 replacing OpenVZ used in version up to 3.4, included), and full virtualization with KVM. It comes with a bare-metal installer and includes a web-based management interface.

All ISOs are based on Proxmox VE 6.3

# user/password
* ```live/evolution```
* ```root/evolution```

# Proxmox VE 6.3

In the pve and incubator versions, there is a pre-configured VM with a TinyCore iso boot image, a Linux version with a 16 MB graphical user interface. 

You can see the virtual machine running simply by logging in as root on proxmox and booting it even without installing the system.

__Please note what this project is in no way connected to Proxmox VE in any official way, it’s just my personal experiment__.


* **naked-ve** - just the juice, without GUI. You can start here to build your revolution! (amd64)

* **pve** - it's not naked, but dressed with xfce4, developer's tools and virt-viewer (amd64)

* **incubator** - it's full workstation for virtualization, with cinnamon, libreoffice, gimp and tools. (amd64)

## More informations
You can find more informations at [Proxmox VE wiki](https://pve.proxmox.com/wiki/Main_Page). 