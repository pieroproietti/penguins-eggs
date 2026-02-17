#!/bin/bash
BIANBU_ORIG="/zfs/original/template/iso/bianbu-25.04-desktop-k1-v3.0.1-release-20250815185656.img"

# 1. Firma SDC e Boot Header (Settore 0)
dd if=$BIANBU_ORIG of=boot_header_sector0.bin bs=512 count=1
sleep 1

# 2. Ambiente U-Boot (FIXATO: aggiunto if=)
dd if=$BIANBU_ORIG of=env.bin bs=512 skip=256 count=512
sleep 1

# 3. SPL (Settore 2048)
dd if=$BIANBU_ORIG of=spl.bin bs=512 skip=2048 count=2048
sleep 1

# 4. U-Boot (Settore 4096)
dd if=$BIANBU_ORIG of=uboot.bin bs=512 skip=4096 count=4096
sleep 1