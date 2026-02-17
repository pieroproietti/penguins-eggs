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
 * Versione aggiornata con sfdisk per UEFI (x86_64)
 */
async function makeImgAmd64(this: Ovary, includeRootHome: boolean) {
    Utils.warning('make live image (x86_64 UEFI) - sfdisk Mode')

    const vars = getVariables(this)
    let script = getScriptHeader(vars)

    script += '# --- 1. CALCOLO DIMENSIONI ---\n'
    script += 'SQUASH_SIZE=$(du -sm "$SRC_DIR/live/filesystem.squashfs" | cut -f1)\n'
    script += 'TOTAL_SIZE=$((SQUASH_SIZE + 1024))\n'
    script += 'dd if=/dev/zero of="$IMG_NAME" bs=1M count=0 seek=$TOTAL_SIZE status=none\n\n'

    script += '# 2. Partizionamento (sfdisk UEFI layout)\n'
    script += 'cat <<EOF | sfdisk --force "$IMG_NAME"\n'
    script += 'label: gpt\n'
    script += 'unit: sectors\n'
    script += '\n'
    // p1: EFI System Partition (256M), GUID: C12A7328-F81F-11D2-BA4B-00A0C93EC93B
    script += 'start=2048, size=524288, type=C12A7328-F81F-11D2-BA4B-00A0C93EC93B, name="EFI"\n'
    // p2: Linux Root (il resto), GUID: 0FC63DAF-8483-4772-8E79-3D69D8477DE4
    script += 'start=526336, type=0FC63DAF-8483-4772-8E79-3D69D8477DE4, name="$IMG_VOLID"\n'
    script += 'EOF\n\n'

    script += '# 3. Formattazione\n'
    script += 'LOOP_DEV=$(losetup -fP --show "$IMG_NAME")\n'
    script += 'sleep 2\n'
    script += 'mkfs.vfat -F32 -n "EFI" "${LOOP_DEV}p1"\n'
    script += 'mkfs.ext4 -L "$IMG_VOLID" -m 0 -q "${LOOP_DEV}p2"\n\n'

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

    const grubModules = 'part_gpt part_msdos fat ext2 search search_label configfile normal linux all_video efi_gop echo test loadenv'

    script += '# 6. ESP Setup\n'
    script += 'mkdir -p "$MNT_DIR/boot_mp/EFI/BOOT"\n'
    script += 'cat <<EOF > "$MNT_DIR/boot_mp/EFI/BOOT/embedded_grub.cfg"\n'
    script += 'insmod part_gpt\n'
    script += 'insmod fat\n'
    script += 'insmod ext2\n'
    script += 'insmod search_label\n'
    script += 'search --no-floppy --label --set=root "$IMG_VOLID"\n'
    script += 'set prefix=(\$root)/boot/grub\n'
    script += 'configfile /boot/grub/grub.cfg\n'
    script += 'EOF\n\n'

    script += `grub-mkimage -c "$MNT_DIR/boot_mp/EFI/BOOT/embedded_grub.cfg" -O x86_64-efi -o "$MNT_DIR/boot_mp/EFI/BOOT/BOOTX64.EFI" -p "" ${grubModules}\n\n`

    script += '# 8. GRUB Config Principale\n'
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


async function makeImgArm64(this: Ovary, includeRootHome: boolean): Promise<string> {
    Utils.warning('make live image (ARM64) - Not yet implemented')
    throw new Error("ARM64 support not yet implemented")
}

/**
 * makeImgRiscv64
 */
async function makeImgRiscv64(this: Ovary, includeRootHome: boolean) {
    Utils.warning('Generating Live Raw Image (RISC-V Spacemit K1) - Atomic Injection Mode')

    const vars = getVariables(this)
    let script = getScriptHeader(vars)

    script += '# --- 1. ALLOCAZIONE IMMAGINE VERGINE ---\n'
    script += 'SQUASH_SIZE=$(du -sm "$SRC_DIR/live/filesystem.squashfs" | cut -f1)\n'
    script += 'TOTAL_SIZE=$((SQUASH_SIZE + 2000))\n'
    script += 'echo "Creating empty file: ${TOTAL_SIZE}MB..."\n'
    script += 'dd if=/dev/zero of="$IMG_NAME" bs=1M count=$TOTAL_SIZE status=none\n\n'

    script += '# 2. PARTIZIONAMENTO GPT (Su file pulito, nessun errore) ---\n'
    script += 'echo "Applying GPT partition table..."\n'
    script += 'cat <<EOF | sfdisk --force "$IMG_NAME"\n'
    script += 'label: gpt\n'
    script += 'label-id: 7AE23FD7-5475-46FD-9BFB-DF2EEA0F2D77\n'
    script += 'unit: sectors\n'
    script += 'first-lba: 34\n\n'
    script += 'start=256, size=512, name="env"\n'
    script += 'start=768, size=128, name="factory"\n'
    script += 'start=2048, size=2048, name="spl"\n'
    script += 'start=4096, size=4096, name="uboot"\n'
    script += 'start=8192, size=524288, uuid=22B753D6-6BB5-4F45-8937-6FFA7CDDAE98, name="bootfs"\n'
    script += 'start=532480, name="rootfs"\n'
    script += 'EOF\n\n'

    script += '# 3. INIEZIONE ATOMICA DEI BINARI DI BOOT (Sopra le partizioni) ---\n'
    script += 'echo "Injecting Bootloader components into sectors..."\n'

    // Firma SDC al settore 0 (necessaria per l'accensione)
    script += 'dd if="$MUSEBOOK_DIR/boot_header_sector0.bin" of="$IMG_NAME" bs=512 count=1 conv=notrunc status=none\n'

    // U-Boot Environment (Settore 256)
    script += 'if [ -f "$MUSEBOOK_DIR/env.bin" ]; then\n'
    script += '    dd if="$MUSEBOOK_DIR/env.bin" of="$IMG_NAME" bs=512 seek=256 conv=notrunc status=none\n'
    script += 'fi\n'

    // SPL (Settore 2048)
    script += 'if [ -f "$MUSEBOOK_DIR/spl.bin" ]; then\n'
    script += '    dd if="$MUSEBOOK_DIR/spl.bin" of="$IMG_NAME" bs=512 seek=2048 conv=notrunc status=none\n'
    script += 'fi\n'

    // U-Boot (Settore 4096)
    script += 'if [ -f "$MUSEBOOK_DIR/uboot.bin" ]; then\n'
    script += '    dd if="$MUSEBOOK_DIR/uboot.bin" of="$IMG_NAME" bs=512 seek=4096 conv=notrunc status=none\n'
    script += 'fi\n\n'


    script += '# 4. FORMATTAZIONE E MOUNT ---\n'
    script += 'LOOP_DEV=$(losetup -fP --show "$IMG_NAME")\n'
    script += 'sleep 2\n'
    script += 'mkfs.ext4 -L "bootfs" -m 0 -q "${LOOP_DEV}p5"\n'
    script += 'mkfs.ext4 -L "rootfs" -m 0 -q "${LOOP_DEV}p6"\n'
    script += 'mkdir -p "$MNT_DIR/boot_mp" "$MNT_DIR/root_mp"\n'
    script += 'mount "${LOOP_DEV}p5" "$MNT_DIR/boot_mp"\n'
    script += 'mount "${LOOP_DEV}p6" "$MNT_DIR/root_mp"\n\n'

    script += '# 5. POPOLAMENTO BOOTFS (KERNEL, DTB, LOGO) ---\n'
    script += 'KERNEL_FILE=$(basename $(find "$SRC_DIR/live" -name "vmlinuz-*" | head -n1))\n'
    script += 'INITRD_FILE=$(basename $(find "$SRC_DIR/live" -name "initrd.img-*" | head -n1))\n'
    script += 'cp "$SRC_DIR/live/$KERNEL_FILE" "$MNT_DIR/boot_mp/vmlinuz"\n'
    script += 'cp "$SRC_DIR/live/$INITRD_FILE" "$MNT_DIR/boot_mp/initrd.img"\n'

    // Test visivo: copia bianbu.bmp se presente
    script += 'if [ -f "$MUSEBOOK_DIR/bianbu.bmp" ]; then\n'
    script += '    cp "$MUSEBOOK_DIR/bianbu.bmp" "$MNT_DIR/boot_mp/"\n'
    script += 'fi\n'

    script += 'mkdir -p "$MNT_DIR/boot_mp/dtb/spacemit" "$MNT_DIR/boot_mp/extlinux"\n'
    script += 'cp "$DTB_DIR"/*.dtb "$MNT_DIR/boot_mp/dtb/spacemit/"\n'

    script += 'cat <<EOF > "$MNT_DIR/boot_mp/extlinux/extlinux.conf"\n'
    script += 'label Eggs-Live\n'
    script += '  kernel /vmlinuz\n'
    script += '  initrd /initrd.img\n'
    script += '  fdt /dtb/spacemit/k1-x_MUSE-Book.dtb\n'
    script += '  append root=LABEL=rootfs boot=live components rw rootwait console=tty1 console=ttyS0,115200 earlycon=sbi\n'
    script += 'EOF\n\n'

    script += '# 6. POPOLAMENTO ROOTFS ---\n'
    script += 'mkdir -p "$MNT_DIR/root_mp/live"\n'
    script += 'cp "$SRC_DIR/live/filesystem.squashfs" "$MNT_DIR/root_mp/live/"\n\n'

    script += '# 7. CHIUSURA ---\n'
    script += 'sync\n'
    script += 'sgdisk -e "$IMG_NAME"\n'

    script += getCleanupLogic()
    script += getFinalizeLogic()

    return await writeScript.call(this, script)
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
    const imgName = ovary.settings.config.snapshot_mnt + ovary.settings.isoFilename
    const imgVolid = ovary.volid
    const mergedDir = ovary.settings.work_dir.merged
    const snapshotExcludes = ovary.settings.config.snapshot_excludes

    let musebookDir = path.resolve(__dirname, '../../../musebook')
    if (!fs.existsSync(musebookDir)) {
        musebookDir = path.resolve('/usr/share/penguins-eggs/musebook')
    }

    return { srcDir, mntDir, dtbDir, imgLnk, imgName, mergedDir, snapshotExcludes, musebookDir, imgVolid }
}

function getScriptHeader(vars: any) {
    let script = '#!/bin/bash\n'
    script += 'set -ex\n\n'
    script += `IMG_LNK="${vars.imgLnk}"\n`
    script += `IMG_NAME="${vars.imgName}"\n`
    script += `IMG_VOLID="${vars.imgVolid}"\n`
    script += `DTB_DIR="${vars.dtbDir}"\n`
    script += `MERGED_DIR="${vars.mergedDir}"\n`
    script += `MNT_DIR="${vars.mntDir}"\n`
    script += `MUSEBOOK_DIR="${vars.musebookDir}"\n`
    script += `SRC_DIR="${vars.srcDir}"\n`
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