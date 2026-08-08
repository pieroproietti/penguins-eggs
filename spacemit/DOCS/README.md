# Spacemit Musebook k1
* Scaricare bianbu-25.04-minimal-k1-v3.0-release-20250725114639.img.zip

* unzip bianbu-25.04-minimal-k1-v3.0-release-20250725114639.img.zip

* sudo dd if=bianbu-25.04-desktop-k1-v3.0-release-20250725125828.img of=/dev/sdb bs=4M status=progress conv=fsync

* connettersi alla rete proietti-armaccancce

```


# Installazione nvme
* copiare bianbu-25.04-minimal-k1-v3.0-release-20250725114639.img su hd esterno

* dd if=bianbu-25.04-minimal-k1-v3.0-release-20250725114639.img of=/dev/nvme0n1 bs=4M status=progress conv=fsync

A questo punto abbiamo ripristinato

# Il problema dell'uuid

* sudo e2fsck -f /dev/nvme0n1p6
* sudo tune2fs -U e95cca29-911c-46c6-8b5a-85f4c26411c9 /dev/nvme0n1p6

conrolla
* blkid /dev/nvme0n1p6 /dev/mmcblk0p6

# boot su nvme
* dd if=/usr/lib/u-boot/spacemit/bootinfo_sd.bin of=/dev/nvme0n1
* dd if=/usr/lib/u-boot/spacemit/FSBL.bin of=/dev/nvme0n1p1 seek=0 bs=1
* dd if=/usr/lib/u-boot/spacemit/env.bin of=/dev/nvme0n1p2 seek=0 bs=1
* dd if=/usr/lib/u-boot/spacemit/u-boot.itb of=/dev/nvme0n1p4 seek=0 bs=1K
* dd if=/usr/lib/riscv64-linux-gnu/opensbi/generic/fw_dynamic.itb of=/dev/nvme0n1p3 seek=0 bs=1K