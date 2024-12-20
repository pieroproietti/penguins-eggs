# Stop the RAID Device
sudo mdadm --stop /dev/md*

# Remove the RAID Device
sudo mdadm --remove /dev/md0

# Remove RAID superblocks
sudo mdadm --zero-superblock /dev/sda /dev/sdb
