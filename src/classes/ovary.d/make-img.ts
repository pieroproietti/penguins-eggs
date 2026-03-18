/**
 * ./src/classes/ovary.d/make-img.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * Refactored for clarity and Live-on-Raw strategy
 */

import path from 'node:path'
import fs from 'node:fs'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import Mustache from 'mustache'

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
    script += 'sync\n'
    script += 'partprobe "${LOOP_DEV}"\n'
    script += 'sleep 2\n'
    script += 'mkfs.fat32 -F32 -L "EFI" "${LOOP_DEV}p1"\n'
    script += 'mkfs.ext4 -L "$IMG_VOLID" -m 0 -q "${LOOP_DEV}p2"\n\n'

    script += '# 4. Mount\n'
    script += 'mkdir -p "$MNT_DIR/bootfs" "$MNT_DIR/rootfs"\n'
    script += 'mount "${LOOP_DEV}p1" "$MNT_DIR/bootfs"\n'
    script += 'mount "${LOOP_DEV}p2" "$MNT_DIR/rootfs"\n\n'

    script += '# 5. Copia file\n'
    script += 'mkdir -p "$MNT_DIR/rootfs/live" "$MNT_DIR/rootfs/boot/grub"\n'
    script += 'cp "$SRC_DIR/live/filesystem.squashfs" "$MNT_DIR/rootfs/live/"\n'
    script += 'KERNEL_FILE=$(basename $(find "$SRC_DIR/live" -name "vmlinuz-*" | head -n1))\n'
    script += 'INITRD_FILE=$(basename $(find "$SRC_DIR/live" -name "initrd.img-*" | head -n1))\n'
    script += 'cp "$SRC_DIR/live/$KERNEL_FILE" "$MNT_DIR/rootfs/boot/"\n'
    script += 'cp "$SRC_DIR/live/$INITRD_FILE" "$MNT_DIR/rootfs/boot/"\n\n'

    const grubModules = 'part_gpt part_msdos fat ext2 search search_label configfile normal linux all_video efi_gop echo test loadenv'

    script += '# 6. ESP Setup\n'
    script += 'mkdir -p "$MNT_DIR/bootfs/EFI/BOOT"\n'
    script += 'cat <<EOF > "$MNT_DIR/bootfs/EFI/BOOT/embedded_grub.cfg"\n'
    script += 'insmod part_gpt\n'
    script += 'insmod fat\n'
    script += 'insmod ext2\n'
    script += 'insmod search_label\n'
    script += 'search --no-floppy --label --set=root "$IMG_VOLID"\n'
    script += 'set prefix=(\$root)/boot/grub\n'
    script += 'configfile /boot/grub/grub.cfg\n'
    script += 'EOF\n\n'

    script += `grub-mkimage -c "$MNT_DIR/bootfs/EFI/BOOT/embedded_grub.cfg" -O x86_64-efi -o "$MNT_DIR/bootfs/EFI/BOOT/BOOTX64.EFI" -p "" ${grubModules}\n\n`

    script += '# 8. GRUB Config Principale\n'
    script += 'cat <<EOF > "$MNT_DIR/rootfs/boot/grub/grub.cfg"\n'
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
 * logic for RISC-V (Spacemit K1 / Musebook)
 * Sequence: Creating ext4 volumes -> Populating -> Genimage pack
 */
async function makeImgRiscv64(this: Ovary, includeRootHome: boolean) {
    Utils.warning('Generating Live Raw Image (RISC-V Spacemit K1) - genimage Mode')

    const vars = getVariables(this)
    let script = getScriptHeader(vars)

    script += '# --- 1. CALCOLO DIMENSIONI E CREAZIONE EXT4 VOLUMES ---\n'
    script += 'mkdir -p "$MNT_DIR/img"\n'

    script += 'SQUASH_SIZE=$(du -sm "$SRC_DIR/live/filesystem.squashfs" | cut -f1)\n'
    script += 'ROOTFS_SIZE=$((SQUASH_SIZE + 1024))\n'
    script += 'echo "Creating bootfs.ext4: 256 MB"\n'
    script += 'dd if=/dev/zero of="$MNT_DIR/bootfs.ext4" bs=1M count=256 status=none\n'
    script += 'mkfs.ext4 -L "bootfs" -m 0 -q "$MNT_DIR/bootfs.ext4"\n'

    script += 'echo "Creating rootfs.ext4: $ROOTFS_SIZE MB"\n'
    script += 'dd if=/dev/zero of="$MNT_DIR/rootfs.ext4" bs=1M count=$ROOTFS_SIZE status=none\n'
    script += 'mkfs.ext4 -L "rootfs" -m 0 -q "$MNT_DIR/rootfs.ext4"\n\n'

    script += '# --- 2. MOUNT VOLUMES ---\n'
    script += 'mkdir -p "$MNT_DIR/bootfs" "$MNT_DIR/rootfs"\n'
    script += 'mount -o loop "$MNT_DIR/bootfs.ext4" "$MNT_DIR/bootfs"\n'
    script += 'mount -o loop "$MNT_DIR/rootfs.ext4" "$MNT_DIR/rootfs"\n\n'

    script += '# --- 3. POPOLAMENTO BOOTFS (KERNEL, DTB, LOGO) ---\n'
    script += 'if [ -f "$SPACEMIT_DIR/bianbu.bmp" ]; then\n'
    script += '    echo "Copying boot logo (bianbu.bmp)..."\n'
    script += '    cp "$SPACEMIT_DIR/bianbu.bmp" "$MNT_DIR/bootfs/"\n'
    script += 'fi\n'

    script += 'KERNEL_FILE=$(basename $(find "$SRC_DIR/live" -name "vmlinu*" | head -n1))\n'
    script += 'INITRD_FILE=$(basename $(find "$SRC_DIR/live" -name "initrd.img-*" | head -n1))\n'
    script += 'cp "$SRC_DIR/live/$KERNEL_FILE" "$MNT_DIR/bootfs/"\n'
    script += 'cp "$SRC_DIR/live/$INITRD_FILE" "$MNT_DIR/bootfs/"\n'

    // Remove path /boot/ to fdtDir
    const fdtDir = vars.fdtDir.replace(/^\/boot\//, '');
    script += `mkdir -p "$MNT_DIR/bootfs/${fdtDir}"\n`;
    script += `cp -rv "${vars.fdtDir}/"* "$MNT_DIR/bootfs/${fdtDir}/"\n`;


    /**
     * Use Mustache to generate the env_k1-x.txt file
     */
    const view = {
        kernel_name: path.basename(this.vmlinuz),
        initrd_name: path.basename(this.initrd),
        fdt_dir: fdtDir,
        fdt_file: vars.fdtFile,
    };

    const template = fs.readFileSync(`${vars.spacemitDir}/env_k1-x.mustache`, 'utf8');
    const envContent = Mustache.render(template, view);
    script += `cat <<'EOF' > "$MNT_DIR/bootfs/env_k1-x.txt"\n${envContent}\nEOF\n\n`;

    script += '# --- 4. POPOLAMENTO ROOTFS ---\n'
    script += 'mkdir -p "$MNT_DIR/rootfs/live"\n'
    script += 'cp "$SRC_DIR/live/filesystem.squashfs" "$MNT_DIR/rootfs/live/"\n\n'

    script += '# --- 5. UMOUNT VOLUMES ---\n'
    script += 'sync\n'
    script += 'umount -R "$MNT_DIR/bootfs" || true\n'
    script += 'umount -R "$MNT_DIR/rootfs" || true\n\n'

    script += '# --- 6. GENIMAGE EXECUTION ---\n'
    script += 'echo "Preparing genimage input directory..."\n'
    script += 'mkdir -p "$MNT_DIR/input" "$MNT_DIR/output" "$MNT_DIR/tmp"\n'
    script += 'cp -r "$SPACEMIT_DIR/"* "$MNT_DIR/input/"\n'
    script += 'mv "$MNT_DIR/bootfs.ext4" "$MNT_DIR/input/bootfs.ext4"\n'
    script += 'mv "$MNT_DIR/rootfs.ext4" "$MNT_DIR/input/rootfs.ext4"\n'
    script += 'echo "Running genimage..."\n'

    script += 'echo genimage --inputpath "$MNT_DIR/input" --outputpath "$MNT_DIR/output" --rootpath "$MNT_DIR/output" --tmppath "$MNT_DIR/tmp" --config "$MNT_DIR/input/genimage.cfg"\n'
    script += 'genimage --inputpath "$MNT_DIR/input" --outputpath "$MNT_DIR/output" --rootpath "$MNT_DIR/output" --tmppath "$MNT_DIR/tmp" --config "$MNT_DIR/input/genimage.cfg"\n'
    script += 'echo "Moving generated image to destination..."\n'
    script += 'mv "$MNT_DIR/output/sdcard.img" "$IMG_NAME"\n\n'

    script += '# --- 7. CHIUSURA ---\n'
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
    const fdtDir = ovary.fdtDir
    const fdtFile = ovary.fdtFile

    ovary.settings.isoFilename = ovary.settings.config.snapshot_prefix + ovary.volid + '_' + Utils.uefiArch() + Utils.getPostfix() + '.img'
    const imgLnk = ovary.settings.config.snapshot_dir + ovary.settings.isoFilename
    const imgName = ovary.settings.config.snapshot_mnt + ovary.settings.isoFilename
    const imgVolid = ovary.volid
    const mergedDir = ovary.settings.work_dir.merged
    const snapshotExcludes = ovary.settings.config.snapshot_excludes

    let spacemitDir = path.resolve(__dirname, '../../../spacemit')
    if (!fs.existsSync(spacemitDir)) {
        spacemitDir = path.resolve('/usr/share/penguins-eggs/spacemit')
    }

    return { srcDir, mntDir, fdtDir, fdtFile, imgLnk, imgName, mergedDir, snapshotExcludes, spacemitDir, imgVolid }
}

function getScriptHeader(vars: any) {
    let script = '#!/bin/bash\n'
    script += 'set -ex\n\n'
    script += `IMG_LNK="${vars.imgLnk}"\n`
    script += `IMG_NAME="${vars.imgName}"\n`
    script += `IMG_VOLID="${vars.imgVolid}"\n`
    // script += `DTB_DIR="${vars.fdtDir}"\n`
    script += `MERGED_DIR="${vars.mergedDir}"\n`
    script += `MNT_DIR="${vars.mntDir}"\n`
    script += `SPACEMIT_DIR="${vars.spacemitDir}"\n`
    script += `SRC_DIR="${vars.srcDir}"\n`
    script += `SNAPSHOT_EXCLUDES="${vars.snapshotExcludes}"\n`
    return script
}

function getCleanupLogic() {
    let script = '# --- CLEANUP ---\n'
    script += 'sync\n'
    script += 'umount -R "$MNT_DIR/rootfs" || true\n'
    script += 'umount -R "$MNT_DIR/bootfs" || true\n'
    script += 'if [ -n "$LOOP_DEV" ] && [ -b "$LOOP_DEV" ]; then\n' // Se esiste e se è un block device
    script += '    losetup -d "$LOOP_DEV" || true\n'
    script += 'fi\n\n'
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