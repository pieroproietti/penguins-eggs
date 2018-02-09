lvremove /dev/penguin/swap
lvremove /dev/penguin/data
lvremove /dev/penguin/root
vgremove /dev/pve
pvremove /dev/sda2
rm /TARGET -rf
