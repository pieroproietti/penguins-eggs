lvremove /dev/pve/swap
lvremove /dev/pve/data
lvremove /dev/pve/root
vgremove /dev/pve
pvremove /dev/sda2
rm /TARGET -rf
