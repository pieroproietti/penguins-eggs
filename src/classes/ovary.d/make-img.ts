/**
 * ./src/classes/ovary.d/make-img.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import path from 'node:path'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * makeImg
 */
export async function makeImg(this: Ovary, scriptOnly = false) {

    Utils.warning('make live image')
    const srcDir = path.join(this.nest, 'mnt/iso')
    const mntDir = path.join(this.nest, 'mnt/img')
    const dtbPath = this.dtb
    const imgName = this.settings.isoFilename.replace('.iso', '.img')
    const imgLnk = this.settings.config.snapshot_dir + imgName
    const workImg = this.settings.config.snapshot_mnt + imgName
    // rename isoFilename to img
    this.settings.isoFilename = imgName

    let script = '#!/bin/bash\n'
    script += `SRC_DIR="${srcDir}"\n`
    script += `DTB_PATH="${dtbPath}"\n`
    script += `IMG_NAME="${workImg}"\n`
    script += `IMG_LNK="${imgLnk}"\n`
    script += `MNT_DIR="${mntDir}"\n`
    script += '\n'

    script += '# 1. Rilevamento Versioni Kernel\n'
    script += 'KERNEL_BIN=$(basename $(find "$SRC_DIR/live" -name "vmlinuz-*" | head -n1))\n'
    script += 'INITRD_BIN=$(basename $(find "$SRC_DIR/live" -name "initrd.img-*" | head -n1))\n'
    script += 'DTB_NAME=$(basename "$DTB_PATH")\n'
    script += '\n'

    script += '# 2. Calcolo Spazio\n'
    script += '# ROOT necessita dimensione squashfs + margine (es. 1GB)\n'
    script += 'ROOT_SIZE=$(du -sm "$SRC_DIR/live/filesystem.squashfs" | cut -f1)\n'
    script += 'TOTAL_SIZE=$((ROOT_SIZE + 1536)) # 1GB margine + 512MB Boot\n'
    script += '\n'

    script += 'echo "Creating raw image: ${TOTAL_SIZE}MB..."\n'
    script += 'dd if=/dev/zero of="$IMG_NAME" bs=1M count=0 seek=$TOTAL_SIZE status=none\n'
    script += '\n'

    script += '# 3. Partizionamento Ibrido\n'
    script += '# P1: 512MB FAT32 (Bootable)\n'
    script += '# P2: Resto EXT4 (Linux)\n'
    script += 'sfdisk "$IMG_NAME" <<EOF\n'
    script += ',512M,c,*\n'
    script += ',,83\n'
    script += 'EOF\n'
    script += '\n'

    script += '# 4. Loopback Setup\n'
    script += 'LOOP_DEV=$(losetup -fP --show "$IMG_NAME")\n'
    script += '\n'

    script += '# 5. Formattazione\n'
    script += 'mkfs.vfat -F 32 -n "BOOT" "${LOOP_DEV}p1"\n'
    script += 'mkfs.ext4 -L "ROOT" -m 0 -q "${LOOP_DEV}p2"\n'
    script += '\n'

    script += '# 6. Mount & Copia\n'
    script += 'mkdir -p "$MNT_DIR/tmp_boot" "$MNT_DIR/tmp_root"\n'
    script += 'mount "${LOOP_DEV}p1" "$MNT_DIR/tmp_boot"\n'
    script += 'mount "${LOOP_DEV}p2" "$MNT_DIR/tmp_root"\n'
    script += '\n'

    script += '# --- COPIA P1 (BOOT) ---\n'
    script += 'mkdir -p "$MNT_DIR/tmp_boot/live"\n'
    script += 'cp "$SRC_DIR/live/$KERNEL_BIN" "$MNT_DIR/tmp_boot/live/"\n'
    script += 'cp "$SRC_DIR/live/$INITRD_BIN" "$MNT_DIR/tmp_boot/live/"\n'
    script += 'cp -r "$SRC_DIR/EFI" "$MNT_DIR/tmp_boot/"\n'
    script += 'cp -r "$SRC_DIR/.disk" "$MNT_DIR/tmp_boot/"\n'
    script += 'cp -r "$SRC_DIR/boot" "$MNT_DIR/tmp_boot/"\n'
    script += 'cp "$SRC_DIR/"*mkinitramfs.log.txt "$MNT_DIR/tmp_boot/" 2>/dev/null || true\n'
    if (this.dtb !== 'none') {
        script += 'cp "$DTB_PATH" "$MNT_DIR/tmp_boot/"\n'
    }
    script += '\n'

    script += '# --- COPIA P2 (ROOT) ---\n'
    script += 'mkdir -p "$MNT_DIR/tmp_root/live"\n'
    script += 'cp "$SRC_DIR/live/filesystem.squashfs" "$MNT_DIR/tmp_root/live/"\n'
    script += '\n'


    script += '# 8. Cleanup\n'
    script += 'umount "$MNT_DIR/tmp_boot" "$MNT_DIR/tmp_root"\n'
    script += 'losetup -d "$LOOP_DEV"\n'
    script += '\n'
    script += '# 9. crate a link\n'
    script += 'ln -sf "$IMG_NAME" "$IMG_LNK"\n'


    const mkImg = path.join(this.settings.work_dir.bin, 'mkimg')
    Utils.writeX(mkImg, script)

    if (!scriptOnly) {
        await exec(mkImg, Utils.setEcho(this.verbose))
    }
}
