#!/bin/bash
#
# parameter: $1 device example: /dev/sda
#
apt-get remove network-manager --purge
apt-get autoremove
echo "deb http://download.proxmox.com/debian/pve stretch pve-no-subscription" > /etc/apt/sources.list.d/pve-install-repo.list
wget http://download.proxmox.com/debian/proxmox-ve-release-5.x.gpg -O /etc/apt/trusted.gpg.d/proxmox-ve-release-5.x.gpg
apt-get update
apt-get dist-upgrade
apt-get install proxmox-ve postfix open-iscsi
apt-get remove os-prober --purge
#apt remove linux-image-amd64 linux-image-4.9.0-3-amd64
