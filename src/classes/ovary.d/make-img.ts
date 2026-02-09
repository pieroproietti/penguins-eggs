/**
 * ./src/classes/ovary.d/make-img.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import path from 'node:path'
import fs from 'node:fs'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * makeImg - RISC-V Spacemit K1 Native Boot
 */
export async function makeImg(this: Ovary, scriptOnly = false) {

    Utils.warning('make live image (RISC-V Spacemit K1 Native)')
    const srcDir = path.join(this.nest, 'mnt/iso')
    const mntDir = path.join(this.nest, 'mnt/img')
    const dtbPath = this.dtb
    const imgName = this.settings.isoFilename.replace('.iso', '.img')
    const imgLnk = this.settings.config.snapshot_dir + imgName
    const workImg = this.settings.config.snapshot_mnt + imgName

    // Path to musebook assets
    let musebookDir = path.resolve(__dirname, '../../../musebook')
    if (!fs.existsSync(musebookDir)) {
        musebookDir = path.resolve('/usr/share/penguins-eggs/musebook')
        if (!fs.existsSync(musebookDir)) {
            Utils.warning(`Warning: MuseBook assets dir not found at ${musebookDir}`)
        }
    }

    // rename isoFilename to img
    this.settings.isoFilename = imgName

    let script = '#!/bin/bash\n'
    script += `SRC_DIR="${srcDir}"\n`
    script += `DTB_PATH="${dtbPath}"\n`
    script += `IMG_NAME="${workImg}"\n`
    script += `IMG_LNK="${imgLnk}"\n`
    script += `MNT_DIR="${mntDir}"\n`
    script += `MUSEBOOK_DIR="${musebookDir}"\n`
    script += '\n'

    script += '# 1. Rilevamento Versioni Kernel e DTB\n'
    script += 'KERNEL_FULL=$(basename $(find "$SRC_DIR/live" -name "vmlinuz-*" | head -n1))\n'
    // Estrae la versione pura (es. da vmlinuz-6.6.63-spacemit -> 6.6.63-spacemit)
    script += 'KERNEL_VER=${KERNEL_FULL#vmlinuz-}\n'
    script += 'INITRD_BIN=$(basename $(find "$SRC_DIR/live" -name "initrd.img-*" | head -n1))\n'
    script += 'DTB_NAME=$(basename "$DTB_PATH")\n'
    script += '\n'
    script += 'echo "Kernel: $KERNEL_FULL (Ver: $KERNEL_VER)"\n'
    script += 'echo "Initrd: $INITRD_BIN"\n'
    script += 'echo "DTB: $DTB_NAME"\n'
    script += '\n'

    script += '# 2. Calcolo Spazio\n'
    script += 'ROOT_SIZE=$(du -sm "$SRC_DIR/live/filesystem.squashfs" | cut -f1)\n'
    script += 'TOTAL_SIZE=$((ROOT_SIZE + 1536)) \n'
    script += '\n'

    script += 'echo "Creating raw image: ${TOTAL_SIZE}MB..."\n'
    script += 'dd if=/dev/zero of="$IMG_NAME" bs=1M count=0 seek=$TOTAL_SIZE status=none\n'
    script += '\n'

    script += '# 3. Partizionamento (GPT) - Layout Bianbu Originale\n'
    script += '# Usiamo -a 1 per allineamento esatto ai settori\n'
    script += 'sgdisk -o "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 1:256:767     -c 1:"spl"      -t 1:8300 "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 2:768:895     -c 2:"env"      -t 2:8300 "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 3:2048:4095   -c 3:"uboot"    -t 3:8300 "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 4:4096:8191   -c 4:"reserved" -t 4:8300 "$IMG_NAME"\n'
    script += '# P5 Boot: Ext4 (Type 8300) - Obbligatorio per questo U-Boot\n'
    script += 'sgdisk -a 1 -n 5:8192:532479 -c 5:"boot"     -t 5:8300 "$IMG_NAME"\n'
    script += '# P6 Root: Ext4\n'
    script += 'sgdisk -a 1 -n 6:532480:0    -c 6:"root"     -t 6:8300 "$IMG_NAME"\n'
    script += '\n'

    script += '# 4. Loopback Setup\n'
    script += 'LOOP_DEV=$(losetup -fP --show "$IMG_NAME")\n'
    script += '\n'

    script += '# 5. Formattazione (EXT4 ovunque)\n'
    script += 'mkfs.ext4 -L "BOOTFS" -m 0 -q "${LOOP_DEV}p5"\n'
    script += 'mkfs.ext4 -L "ROOTFS" -m 0 -q "${LOOP_DEV}p6"\n'
    script += '\n'

    script += '# 6. Mount & Copia\n'
    script += 'mkdir -p "$MNT_DIR/tmp_boot" "$MNT_DIR/tmp_root"\n'
    script += 'mount "${LOOP_DEV}p5" "$MNT_DIR/tmp_boot"\n'
    script += 'mount "${LOOP_DEV}p6" "$MNT_DIR/tmp_root"\n'
    script += '\n'

    script += '# --- POPOLAMENTO BOOT (Mimicry Bianbu) ---\n'
    script += '# 1. Kernel e Initrd nella root di boot\n'
    script += 'cp "$SRC_DIR/live/$KERNEL_FULL" "$MNT_DIR/tmp_boot/"\n'
    script += 'cp "$SRC_DIR/live/$INITRD_BIN" "$MNT_DIR/tmp_boot/"\n'

    script += '# 2. Struttura DTB specifica (spacemit/VERSIONE/)\n'
    script += '# NOTA: Bianbu usa "spacemit/6.6.63". Noi usiamo la versione rilevata.\n'
    script += 'mkdir -p "$MNT_DIR/tmp_boot/spacemit/$KERNEL_VER"\n'
    script += 'if [ -f "$DTB_PATH" ]; then\n'
    script += '    cp "$DTB_PATH" "$MNT_DIR/tmp_boot/spacemit/$KERNEL_VER/"\n'
    script += 'else\n'
    script += '    echo "WARNING: DTB not found at $DTB_PATH"\n'
    script += 'fi\n'

    script += '# 3. Generazione env_k1-x.txt (IL SEGRETO!)\n'
    script += 'echo "Generating /boot/env_k1-x.txt..."\n'
    script += 'ENV_FILE="$MNT_DIR/tmp_boot/env_k1-x.txt"\n'
    script += 'echo "knl_name=$KERNEL_FULL" > "$ENV_FILE"\n'
    script += 'echo "ramdisk_name=$INITRD_BIN" >> "$ENV_FILE"\n'
    script += 'echo "dtb_dir=spacemit/$KERNEL_VER" >> "$ENV_FILE"\n'

    script += '# 4. Tentativo di Override Bootargs (Live Boot)\n'
    script += '# Proviamo ad aggiungere bootargs qui. Se U-Boot lo ignora, proveremo extlinux come fallback.\n'
    script += 'echo "bootargs=boot=live components quiet splash console=ttyS0,115200 earlycon=sbi clk_ignore_unused rootwait" >> "$ENV_FILE"\n'
    script += '\n'

    script += '# 5. Extlinux Fallback (Non si sa mai)\n'
    script += 'mkdir -p "$MNT_DIR/tmp_boot/extlinux"\n'
    script += 'cat <<EOF > "$MNT_DIR/tmp_boot/extlinux/extlinux.conf"\n'
    script += 'label eggs-live\n'
    script += '  kernel /$KERNEL_FULL\n'
    script += '  initrd /$INITRD_BIN\n'
    script += '  fdt /spacemit/$KERNEL_VER/$DTB_NAME\n'
    script += '  append boot=live components quiet splash console=ttyS0,115200 earlycon=sbi clk_ignore_unused rootwait\n'
    script += 'EOF\n'
    script += '\n'

    script += '# --- COPIA ROOT (SquashFS Live) ---\n'
    script += 'mkdir -p "$MNT_DIR/tmp_root/live"\n'
    script += 'cp "$SRC_DIR/live/filesystem.squashfs" "$MNT_DIR/tmp_root/live/"\n'
    script += '\n'

    script += '# 8. Cleanup\n'
    script += 'umount "$MNT_DIR/tmp_boot" "$MNT_DIR/tmp_root"\n'
    script += 'losetup -d "$LOOP_DEV"\n'
    script += '\n'

    script += '# 9. Inietta i Bootloader\n'
    script += 'echo "Scrittura Bootloader..."\n'
    script += 'if [ -f "$MUSEBOOK_DIR/spl.bin" ] && [ -f "$MUSEBOOK_DIR/uboot.itb" ]; then\n'
    script += '    dd if="$MUSEBOOK_DIR/spl.bin" of="$IMG_NAME" bs=512 seek=256 conv=notrunc status=none\n'
    script += '    dd if="$MUSEBOOK_DIR/uboot.itb" of="$IMG_NAME" bs=512 seek=2048 conv=notrunc status=none\n'
    script += '    sync\n'
    script += '    echo "Bootloaders injected!"\n'
    script += 'else\n'
    script += '    echo "ERROR: Bootloader files missing!"\n'
    script += 'fi\n'
    script += '\n'

    script += '# 10. Link\n'
    script += 'ln -sf "$IMG_NAME" "$IMG_LNK"\n'

    const mkImg = path.join(this.settings.work_dir.bin, 'mkimg')
    Utils.writeX(mkImg, script)

    if (!scriptOnly) {
        await exec(mkImg, Utils.setEcho(this.verbose))
    }
}