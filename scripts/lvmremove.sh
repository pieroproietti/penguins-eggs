lvremove /dev/penguin/swap
lvremove /dev/penguin/data
lvremove /dev/penguin/root
vgremove /dev/penguin
pvremove /dev/sda2
rm /TARGET -rf
