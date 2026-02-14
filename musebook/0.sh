# Sostituisci con il nome esatto della tua immagine originale
IMG_ORIGINALE="Bianbu-LXQt-K1-sdcard-V2.3.0-20251212104943.img"

# Estrai SPL (Settore 256)
dd if=$IMG_ORIGINALE of=spl.bin bs=512 skip=256 count=512 status=none
echo "SPL Estratto."

# Estrai U-Boot (Settore 2048)
dd if=$IMG_ORIGINALE of=uboot.itb bs=512 skip=2048 count=6144 status=none
echo "U-Boot Estratto."

