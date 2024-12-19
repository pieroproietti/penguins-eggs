
InstallDevice=/dev/sda
parted --script ${installDevice} mklabel msdos
parted --script --align optimal ${installDevice} mkpart primary linux-swap         1MiB    ${swapSize + 1}MiB
parted --script --align optimal ${installDevice} mkpart primary ext4 ${swapSize + 1}MiB                100%
parted ${installDevice} set 1 boot on
parted ${installDevice} set 1 esp on

mdadm --create --verbose /dev/md0 --level=1 --raid-devices=2 /dev/sda /dev/sdb