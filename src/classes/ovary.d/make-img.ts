/**
 * ./src/classes/ovary.d/make-img.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * Refactored for clarity and Live-on-Raw strategy
 */

import path from 'node:path'
import fs from 'node:fs'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import Diversions from '../diversions.js'
import { getStandardExclusions } from './make-squashfs.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Entry point for creating the raw image
 */
export async function makeImg(this: Ovary, includeRootHome = false): Promise<string> {
    if (process.arch === 'riscv64') {
        return await makeImgRiscv64.call(this, includeRootHome)
    } else if (process.arch === 'x64') {
        return await makeImgAmd64.call(this, includeRootHome)
    } else if (process.arch === 'arm64') {
        return await makeImgArm64.call(this, includeRootHome)
    } else {
        Utils.error(`Architecture ${process.arch} not supported`)
        process.exit(1)
    }
}

/**
 * makeImgAmd64
 * Versione "Brute Force" con configurazione EMBEDDED
 */
async function makeImgAmd64(this: Ovary, includeRootHome: boolean) {
    Utils.warning('make live image (x86_64 UEFI) - Brute Force Mode')

    const vars = getVariables(this)
    let script = getScriptHeader(vars)

    script += '# --- 1. CALCOLO DIMENSIONI ---\n'
    script += 'SQUASH_SIZE=$(du -sm "$SRC_DIR/live/filesystem.squashfs" | cut -f1)\n'
    script += 'TOTAL_SIZE=$((SQUASH_SIZE + 1024))\n'
    script += 'dd if=/dev/zero of="$IMG_NAME" bs=1M count=0 seek=$TOTAL_SIZE status=none\n\n'

    script += '# 2. Partizionamento\n'
    script += 'sgdisk -o "$IMG_NAME"\n'
    script += 'sgdisk -n 1:2048:+256M -c 1:"EFI" -t 1:ef00 "$IMG_NAME"\n'
    script += 'sgdisk -n 2:0:0        -c 2:"LIVE" -t 2:8300 "$IMG_NAME"\n\n'

    script += '# 3. Formattazione\n'
    script += 'LOOP_DEV=$(losetup -fP --show "$IMG_NAME")\n'
    script += 'sleep 2\n'
    script += 'mkfs.vfat -F32 -n "EFI" "${LOOP_DEV}p1"\n'
    script += 'mkfs.ext4 -L "LIVE" -m 0 -q "${LOOP_DEV}p2"\n\n'

    script += '# 4. Mount\n'
    script += 'mkdir -p "$MNT_DIR/boot_mp" "$MNT_DIR/root_mp"\n'
    script += 'mount "${LOOP_DEV}p1" "$MNT_DIR/boot_mp"\n'
    script += 'mount "${LOOP_DEV}p2" "$MNT_DIR/root_mp"\n\n'

    script += '# 5. Copia file\n'
    script += 'mkdir -p "$MNT_DIR/root_mp/live" "$MNT_DIR/root_mp/boot/grub"\n'
    script += 'cp "$SRC_DIR/live/filesystem.squashfs" "$MNT_DIR/root_mp/live/"\n'
    script += 'KERNEL_FILE=$(basename $(find "$SRC_DIR/live" -name "vmlinuz-*" | head -n1))\n'
    script += 'INITRD_FILE=$(basename $(find "$SRC_DIR/live" -name "initrd.img-*" | head -n1))\n'
    script += 'cp "$SRC_DIR/live/$KERNEL_FILE" "$MNT_DIR/root_mp/boot/"\n'
    script += 'cp "$SRC_DIR/live/$INITRD_FILE" "$MNT_DIR/root_mp/boot/"\n\n'

    // LISTA MODULI COMPLETA: Inseriamo tutto il necessario per non dipendere dal prefix
    const grubModules = 'part_gpt part_msdos fat ext2 search search_label configfile normal linux all_video efi_gop echo test loadenv'

    script += '# 6. ESP Setup - Generazione binario con configurazione incorporata\n'
    script += 'mkdir -p "$MNT_DIR/boot_mp/EFI/BOOT"\n'
    script += 'cat <<EOF > "$MNT_DIR/boot_mp/EFI/BOOT/embedded_grub.cfg"\n'
    script += 'insmod part_gpt\n'
    script += 'insmod fat\n'
    script += 'insmod ext2\n'
    script += 'insmod search_label\n'
    script += 'echo "Searching for LIVE partition..."\n'
    script += 'search --no-floppy --label --set=root LIVE\n'
    script += 'set prefix=(\$root)/boot/grub\n'
    script += 'configfile /boot/grub/grub.cfg\n'
    script += 'EOF\n\n'

    // IL COMANDO MANCANTE: Crea il binario EFI incorporando la configurazione sopra
    script += `grub-mkimage -c "$MNT_DIR/boot_mp/EFI/BOOT/embedded_grub.cfg" -O x86_64-efi -o "$MNT_DIR/boot_mp/EFI/BOOT/BOOTX64.EFI" -p "" ${grubModules}\n\n`

    script += '# 8. GRUB Config Principale (nella partizione LIVE)\n'
    script += 'cat <<EOF > "$MNT_DIR/root_mp/boot/grub/grub.cfg"\n'
    script += 'set timeout=5\n'
    script += 'insmod all_video\n'
    script += 'menuentry "Penguins Eggs Live" {\n'
    script += '    linux /boot/' + '$KERNEL_FILE' + ' boot=live components quiet splash\n'
    script += '    initrd /boot/' + '$INITRD_FILE' + '\n'
    script += '}\n'
    script += 'EOF\n\n'

    script += getCleanupLogic()
    script += getFinalizeLogic()

    return await writeScript.call(this, script)
}


/**
 * makeImgRiscv64
 */
async function makeImgRiscv64(this: Ovary, includeRootHome: boolean) {
    Utils.warning('Generating Live Raw Image (RISC-V Spacemit K1)')

    const vars = getVariables(this)
    let script = getScriptHeader(vars)

    script += '# --- 1. CALCOLO DIMENSIONI ---\n'
    script += 'SQUASH_SIZE=$(du -sm "$SRC_DIR/live/filesystem.squashfs" | cut -f1)\n'
    script += 'TOTAL_SIZE=$((SQUASH_SIZE + 1024))\n'
    script += 'dd if=/dev/zero of="$IMG_NAME" bs=1M count=0 seek=$TOTAL_SIZE status=none\n\n'

    script += '# 2. Partizionamento (Offset 2MB per SPL/U-Boot)\n'
    script += 'sgdisk -o "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 1:4096:0 -c 1:"LIVE" -t 1:8300 "$IMG_NAME"\n\n'

    script += '# 3. Loop & Format\n'
    script += 'LOOP_DEV=$(losetup -fP --show "$IMG_NAME")\n'
    script += 'mkfs.ext4 -L "LIVE" -m 0 -q "${LOOP_DEV}p1"\n'
    script += 'mkdir -p "$MNT_DIR/root_mp"\n'
    script += 'mount "${LOOP_DEV}p1" "$MNT_DIR/root_mp"\n\n'

    script += '# 4. Popolamento Live e Boot\n'
    script += 'mkdir -p "$MNT_DIR/root_mp/live" "$MNT_DIR/root_mp/boot/extlinux"\n'
    script += 'cp "$SRC_DIR/live/filesystem.squashfs" "$MNT_DIR/root_mp/live/"\n'

    script += 'KERNEL_FILE=$(basename $(find "$SRC_DIR/live" -name "vmlinuz-*" | head -n1))\n'
    script += 'INITRD_FILE=$(basename $(find "$SRC_DIR/live" -name "initrd.img-*" | head -n1))\n'
    script += 'KERNEL_VER=${KERNEL_FILE#vmlinuz-}\n'
    script += 'cp "$SRC_DIR/live/$KERNEL_FILE" "$MNT_DIR/root_mp/boot/"\n'
    script += 'cp "$SRC_DIR/live/$INITRD_FILE" "$MNT_DIR/root_mp/boot/"\n\n'

    script += 'if [ -d "$DTB_DIR" ]; then\n'
    script += '    mkdir -p "$MNT_DIR/root_mp/boot/spacemit/$KERNEL_VER"\n'
    script += '    cp "$DTB_DIR"/*.dtb "$MNT_DIR/root_mp/boot/spacemit/$KERNEL_VER/"\n'
    script += 'fi\n\n'

    script += '# 5. Configurazione Extlinux\n'
    script += 'cat <<EOF > "$MNT_DIR/root_mp/boot/extlinux/extlinux.conf"\n'
    script += 'label linux\n'
    script += '    kernel /boot/${KERNEL_FILE}\n'
    script += '    initrd /boot/${INITRD_FILE}\n'
    script += '    fdtdir /boot/spacemit/${KERNEL_VER}/\n'
    script += '    append root=LABEL=LIVE boot=live components rw rootwait console=ttyS0,115200 earlycon=sbi\n'
    script += 'EOF\n\n'

    script += '# 6. Iniezione Bootloader (Settori 256 e 2048)\n'
    script += 'dd if="$MUSEBOOK_DIR/spl.bin" of="$IMG_NAME" bs=512 seek=256 conv=notrunc status=none\n'
    script += 'dd if="$MUSEBOOK_DIR/uboot.itb" of="$IMG_NAME" bs=512 seek=2048 conv=notrunc status=none\n\n'

    script += getCleanupLogic()
    script += getFinalizeLogic()

    return await writeScript.call(this, script)
}

async function makeImgArm64(this: Ovary, includeRootHome: boolean): Promise<string> {
    Utils.warning('make live image (ARM64) - Not yet implemented')
    throw new Error("ARM64 support not yet implemented")
}

// ============================================================================
// HELPERS
// ============================================================================

function getVariables(ovary: Ovary) {
    const srcDir = path.join(ovary.nest, 'mnt/iso')
    const mntDir = path.join(ovary.nest, 'mnt/img')
    const dtbDir = ovary.dtbDir

    ovary.settings.isoFilename = ovary.settings.config.snapshot_prefix + ovary.volid + '_' + Utils.uefiArch() + Utils.getPostfix() + '.img'
    const imgLnk = ovary.settings.config.snapshot_dir + ovary.settings.isoFilename
    const workImg = ovary.settings.config.snapshot_mnt + ovary.settings.isoFilename
    const mergedDir = ovary.settings.work_dir.merged
    const snapshotExcludes = ovary.settings.config.snapshot_excludes

    let musebookDir = path.resolve(__dirname, '../../../musebook')
    if (!fs.existsSync(musebookDir)) {
        musebookDir = path.resolve('/usr/share/penguins-eggs/musebook')
    }

    return { srcDir, mntDir, dtbDir, imgLnk, workImg, mergedDir, snapshotExcludes, musebookDir }
}

function getScriptHeader(vars: any) {
    let script = '#!/bin/bash\n'
    script += 'set -ex\n\n'
    script += `SRC_DIR="${vars.srcDir}"\n`
    script += `DTB_DIR="${vars.dtbDir}"\n`
    script += `IMG_NAME="${vars.workImg}"\n`
    script += `IMG_LNK="${vars.imgLnk}"\n`
    script += `MNT_DIR="${vars.mntDir}"\n`
    script += `MUSEBOOK_DIR="${vars.musebookDir}"\n`
    script += `MERGED_DIR="${vars.mergedDir}"\n`
    script += `SNAPSHOT_EXCLUDES="${vars.snapshotExcludes}"\n`
    return script
}

function getCleanupLogic() {
    let script = '# --- CLEANUP ---\n'
    script += 'sync\n'
    script += 'umount -R "$MNT_DIR/root_mp" || true\n'
    script += 'umount -R "$MNT_DIR/boot_mp" || true\n'
    script += 'losetup -d "$LOOP_DEV"\n\n'
    return script
}

function getFinalizeLogic() {
    let script = 'ln -sf "$IMG_NAME" "$IMG_LNK"\n'
    script += 'echo "Image created successfully: $IMG_LNK"\n'
    return script
}

async function writeScript(this: Ovary, script: string): Promise<string> {
    const mkImg = path.join(this.settings.work_dir.bin, 'mkimg')
    Utils.writeX(mkImg, script)
    return mkImg
}