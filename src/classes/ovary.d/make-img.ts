/**
 * ./src/classes/ovary.d/make-img.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * Refactored for clarity and architecture separation
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
 * logic for x86_64 (UEFI)
 */
async function makeImgAmd64(this: Ovary, includeRootHome: boolean) {
    Utils.warning('make live image (x86_64 UEFI)')

    const vars = getVariables(this)
    let script = getScriptHeader(vars)

    script += getCommonSizeCalc()

    // --- x86_64 SETUP ---
    const bootloaders = Diversions.bootloaders(this.familyId)
    const grubEfi = path.resolve(bootloaders, `grub/x86_64-efi/monolithic/grubx64.efi`)

    script += `GRUB_EFI="${grubEfi}"\n`
    script += '# --- x86_64 SETUP ---\n'
    script += '# 2. Partizionamento (UEFI Standard)\n'
    script += 'sgdisk -o "$IMG_NAME"\n'
    script += 'sgdisk -n 1:2048:+256M -c 1:"EFI System" -t 1:ef00 "$IMG_NAME"\n' // ESP
    script += 'sgdisk -n 2:0:0        -c 2:"Linux Root" -t 2:8300 "$IMG_NAME"\n\n' // Root

    script += '# 3. Loop & Format\n'
    script += 'LOOP_DEV=$(losetup -fP --show "$IMG_NAME")\n'
    script += 'sleep 2\n'
    script += 'mkfs.vfat -F32 -n "EFI" "${LOOP_DEV}p1"\n'
    script += `mkfs.ext4 -L "ROOTFS" -m 0 -q "\${LOOP_DEV}p2"\n`
    script += 'UUID_EFI=$(blkid -s UUID -o value "${LOOP_DEV}p1")\n'
    script += 'UUID_ROOT=$(blkid -s UUID -o value "${LOOP_DEV}p2")\n'
    script += 'echo "UUID_EFI=${UUID_EFI}"\n'
    script += 'echo "UUID_ROOT=${UUID_ROOT}"\n\n'

    script += '# 4. Mount (UEFI Style)\n'
    script += 'mkdir -p "$MNT_DIR/boot_mp" "$MNT_DIR/root_mp"\n'
    script += 'mount "${LOOP_DEV}p1" "$MNT_DIR/boot_mp"\n'
    script += 'mount "${LOOP_DEV}p2" "$MNT_DIR/root_mp"\n\n'

    script += '# 5. ESP Setup (Loader Stub - Generated via grub-mkimage)\n'
    script += 'mkdir -p "$MNT_DIR/boot_mp/EFI/BOOT"\n'

    // Modules
    const grubModules = 'part_gpt part_msdos fat ext2 iso9660 search search_fs_uuid search_label search_fs_file file configfile normal linux boot all_video gfxterm gettext help echo ls cat reboot minicmd nativedisk regexp test efi_gop efi_uga video_bochs video_cirrus lvm luks gcry_rijndael gcry_sha256 pbkdf2 relocator mmap cpuid serial'

    script += 'cat <<EOF > "$MNT_DIR/boot_mp/EFI/BOOT/early.cfg"\n'
    script += 'insmod serial\n'
    script += 'serial --unit=0 --speed=115200\n'
    script += 'terminal_input console serial\n'
    script += 'terminal_output console serial\n'
    script += 'echo "EARLY: Starting early.cfg"\n'
    script += 'echo "EARLY: Searching for EFI partition via UUID: ${UUID_EFI}..."\n'
    script += 'search --no-floppy --fs-uuid --set=root ${UUID_EFI}\n'
    script += 'if [ -z "\\$root" ]; then\n'
    script += '    echo "EARLY: Search failed, invalid \\$root"\n'
    script += '    echo "EARLY: Trying cmdpath: \\$cmdpath"\n'
    script += '    set root=(\\$cmdpath)\n'
    script += 'fi\n'
    script += 'echo "EARLY: Root is \\$root"\n'
    script += 'set prefix=(\\$root)/EFI/BOOT\n'
    script += 'echo "EARLY: Loading grub.cfg from \\$prefix"\n'
    script += 'configfile (\\$root)/EFI/BOOT/grub.cfg\n'
    script += 'echo "EARLY: Failed to load configfile!"\n'
    script += 'ls\n'
    script += 'sleep 10\n'
    script += 'EOF\n\n'

    script += `grub-mkimage -c "$MNT_DIR/boot_mp/EFI/BOOT/early.cfg" -O x86_64-efi -o "$MNT_DIR/boot_mp/EFI/BOOT/BOOTX64.EFI" -p "/EFI/BOOT" ${grubModules}\n`
    script += 'rm "$MNT_DIR/boot_mp/EFI/BOOT/early.cfg"\n'

    // Stub grub.cfg in ESP
    script += 'cat <<EOF > "$MNT_DIR/boot_mp/EFI/BOOT/grub.cfg"\n'
    script += 'set timeout=5\n'
    script += 'echo "ESP: Loaded grub.cfg in EFI partition"\n'
    script += 'echo "ESP: Searching for ROOTFS UUID: ${UUID_ROOT}..."\n'
    script += 'search --no-floppy --fs-uuid --set=root ${UUID_ROOT}\n'
    script += 'if [ -z "\\$root" ]; then\n'
    script += '    echo "ESP: ROOTFS not found, trying file..."\n'
    script += '    search --no-floppy --set=root --file /boot/grub/grub.cfg\n'
    script += 'fi\n'
    script += 'if [ -z "\\$root" ]; then\n'
    script += '    echo "ERROR: Root partition not found!"\n'
    script += '    ls\n'
    script += '    sleep 10\n'
    script += 'else\n'
    script += '    echo "ESP: Found root at \\$root"\n'
    script += '    set prefix=(\\$root)/boot/grub\n'
    script += '    echo "ESP: Loading real grub.cfg..."\n'
    script += '    configfile (\\$root)/boot/grub/grub.cfg\n'
    script += 'fi\n'
    script += 'EOF\n\n'

    // --- RSYNC ---
    // Ensure UsrMerge symlinks exist before rsync to prevent directory creation
    script += '# --- UsrMerge Symlinks ---\n'
    script += 'ln -sf usr/bin "$MNT_DIR/root_mp/bin"\n'
    script += 'ln -sf usr/sbin "$MNT_DIR/root_mp/sbin"\n'
    script += 'ln -sf usr/lib "$MNT_DIR/root_mp/lib"\n'
    script += 'ln -sf usr/lib64 "$MNT_DIR/root_mp/lib64"\n\n'

    script += getRsyncLogic.call(this, includeRootHome)

    // --- POST CONFIG ---
    script += '# --- x86_64 POST-CONFIG ---\n'
    script += 'mkdir -p "$MNT_DIR/root_mp/etc"\n'
    script += 'echo "LABEL=ROOTFS  /          ext4  errors=remount-ro  0  1" > "$MNT_DIR/root_mp/etc/fstab"\n'
    //script += 'echo "LABEL=EFI     /boot/efi  vfat  umount=0077        0  1" >> "$MNT_DIR/root_mp/etc/fstab"\n'
    script += 'echo "LABEL=EFI     /boot/efi  vfat  umask=0077        0  1" >> "$MNT_DIR/root_mp/etc/fstab"\n'
    script += 'mkdir -p "$MNT_DIR/root_mp/boot/efi"\n'

    script += 'mkdir -p "$MNT_DIR/root_mp/boot/grub/x86_64-efi"\n'
    script += 'cp -r /usr/lib/grub/x86_64-efi/*.mod "$MNT_DIR/root_mp/boot/grub/x86_64-efi/"\n'
    script += 'cp -r /usr/lib/grub/x86_64-efi/*.lst "$MNT_DIR/root_mp/boot/grub/x86_64-efi/"\n'

    script += 'KERNEL=$(basename $(find "$MNT_DIR/root_mp/boot" -name "vmlinuz-*" | head -n1))\n'
    script += 'INITRD=$(basename $(find "$MNT_DIR/root_mp/boot" -name "initrd.img-*" | head -n1))\n'

    script += 'cat <<EOF > "$MNT_DIR/root_mp/boot/grub/grub.cfg"\n'
    script += 'set timeout=5\n'
    script += 'set default=0\n'
    script += 'insmod all_video\n'
    script += 'insmod gfxterm\n'
    script += 'insmod serial\n'
    script += 'serial --unit=0 --speed=115200\n'
    script += 'terminal_input console serial\n'
    script += 'terminal_output console serial\n'
    script += 'menuentry "Penguins Eggs" {\n'
    script += '    echo "Loading Linux..."\n'
    script += '    linux /boot/$KERNEL root=UUID=${UUID_ROOT} rw console=ttyS0\n'
    script += '    echo "Loading initrd..."\n'
    script += '    initrd /boot/$INITRD\n'
    script += '}\n'
    script += 'EOF\n\n'

    script += getCleanupLogic()
    script += getFinalizeLogic()

    return await writeScript.call(this, script)
}





/**
 * makeImgRiscv64
 * logic for RISC-V (Bianbu/Spacemit)
 */
async function makeImgRiscv64(this: Ovary, includeRootHome: boolean) {
    Utils.warning('make live image (RISC-V Spacemit K1 Native)')

    const vars = getVariables(this)
    let script = getScriptHeader(vars)

    script += getCommonSizeCalc()

    // --- RISC-V SETUP ---
    script += '# --- RISC-V SETUP ---\n'
    script += 'KERNEL_FULL=$(basename $(find "$SRC_DIR/live" -name "vmlinuz-*" | head -n1))\n'
    script += 'KERNEL_VER=${KERNEL_FULL#vmlinuz-}\n'
    script += 'INITRD_BIN=$(basename $(find "$SRC_DIR/live" -name "initrd.img-*" | head -n1))\n\n'

    script += '# 2. Partizionamento (GPT) - Layout Bianbu\n'
    script += 'sgdisk -o "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 1:256:767      -c 1:"spl"       -t 1:8300 "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 2:768:895      -c 2:"env"       -t 2:8300 "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 3:2048:4095    -c 3:"uboot"     -t 3:8300 "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 4:4096:8191    -c 4:"reserved"  -t 4:8300 "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 5:8192:532479  -c 5:"boot"      -t 5:8300 "$IMG_NAME"\n'
    script += 'sgdisk -a 1 -n 6:532480:0     -c 6:"root"      -t 6:8300 "$IMG_NAME"\n\n'

    script += '# 3. Loop & Format\n'
    script += 'LOOP_DEV=$(losetup -fP --show "$IMG_NAME")\n'
    script += 'mkfs.ext4 -L "BOOTFS" -m 0 -q "\${LOOP_DEV}p5"\n'
    script += 'mkfs.ext4 -L "ROOTFS" -m 0 -q "\${LOOP_DEV}p6"\n\n'

    script += '# 4. Mount (RISC-V Style)\n'
    script += 'mkdir -p "$MNT_DIR/boot_mp" "$MNT_DIR/root_mp"\n'
    script += 'mount "${LOOP_DEV}p5" "$MNT_DIR/boot_mp"\n'
    script += 'mount "${LOOP_DEV}p6" "$MNT_DIR/root_mp"\n\n'

    script += '# 5. Populate Boot Partition\n'
    script += 'cp "$SRC_DIR/live/$KERNEL_FULL" "$MNT_DIR/boot_mp/"\n'
    script += 'cp "$SRC_DIR/live/$INITRD_BIN" "$MNT_DIR/boot_mp/"\n'
    script += 'mkdir -p "$MNT_DIR/boot_mp/spacemit/$KERNEL_VER"\n'
    script += '[ -d "$DTB_DIR" ] && cp "$DTB_DIR"/*.dtb "$MNT_DIR/boot_mp/spacemit/$KERNEL_VER/"\n'

    script += '# Env Generation\n'
    script += 'echo "knl_name=$KERNEL_FULL" > "$MNT_DIR/boot_mp/env_k1-x.txt"\n'
    script += 'echo "ramdisk_name=$INITRD_BIN" >> "$MNT_DIR/boot_mp/env_k1-x.txt"\n'
    script += 'echo "dtb_dir=spacemit/$KERNEL_VER" >> "$MNT_DIR/boot_mp/env_k1-x.txt"\n'
    script += 'echo "bootargs=root=LABEL=ROOTFS rw rootwait console=ttyS0,115200 earlycon=sbi clk_ignore_unused" >> "$MNT_DIR/boot_mp/env_k1-x.txt"\n\n'

    // --- RSYNC ---
    script += getRsyncLogic.call(this, includeRootHome)

    // --- POST CONFIG ---
    script += '# --- RISC-V POST-CONFIG ---\n'
    script += 'mkdir -p "$MNT_DIR/boot_mp/extlinux"\n'
    script += 'cat <<EOF > "$MNT_DIR/boot_mp/extlinux/extlinux.conf"\n'
    script += 'label linux\n'
    script += '    linux /${KERNEL_FULL}\n'
    script += '    initrd /${INITRD_BIN}\n'
    script += '    fdtdir /spacemit/${KERNEL_VER}/\n'
    script += '    append root=LABEL=ROOTFS rw rootwait console=ttyS0,115200 earlycon=sbi clk_ignore_unused\n'
    script += 'EOF\n\n'

    script += 'mkdir -p "$MNT_DIR/root_mp/etc"\n'
    script += 'echo "LABEL=ROOTFS  /          ext4  errors=remount-ro  0  1" > "$MNT_DIR/root_mp/etc/fstab"\n'
    script += 'echo "LABEL=BOOTFS  /boot      ext4  defaults           0  2" >> "$MNT_DIR/root_mp/etc/fstab"\n'

    script += getCleanupLogic()

    // --- BOOTLOADER INJECTION ---
    script += '# --- RISC-V BOOTLOADER INJECTION ---\n'
    script += 'if [ -f "$MUSEBOOK_DIR/spl.bin" ] && [ -f "$MUSEBOOK_DIR/uboot.itb" ]; then\n'
    script += '    dd if="$MUSEBOOK_DIR/spl.bin" of="$IMG_NAME" bs=512 seek=256 conv=notrunc status=none\n'
    script += '    dd if="$MUSEBOOK_DIR/uboot.itb" of="$IMG_NAME" bs=512 seek=2048 conv=notrunc status=none\n'
    script += 'else\n'
    script += '    echo "WARNING: Bootloader files missing!"\n'
    script += 'fi\n'

    script += getFinalizeLogic()

    return await writeScript.call(this, script)
}

/**
 * makeImgArm64
 * Placeholder for ARM64
 */
async function makeImgArm64(this: Ovary, includeRootHome: boolean): Promise<string> {
    Utils.warning('make live image (ARM64) - Not yet implemented')
    // Placeholder: Clone structure of other functions when ready
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
    script += '\n'
    script += 'if [ -d "$IMG_NAME" ]; then echo "ERROR: IMG_NAME is a directory!"; exit 1; fi\n\n'
    return script
}

function getCommonSizeCalc() {
    let script = '# --- 1. CALCOLO DIMENSIONI ---\n'
    script += 'ROOT_SIZE=$(du -sm "$MERGED_DIR" | cut -f1)\n'
    script += 'TOTAL_SIZE=$((ROOT_SIZE + 1536))\n'
    script += 'echo "Creating raw image: ${TOTAL_SIZE}MB..."\n'
    script += 'dd if=/dev/zero of="$IMG_NAME" bs=1M count=0 seek=$TOTAL_SIZE status=none\n\n'
    return script
}

function getRsyncLogic(this: Ovary, includeRootHome: boolean) {
    let script = '# --- COPIA FILESYSTEM (RSYNC) ---\n'
    script += 'echo "Rsyncing filesystem..."\n'

    const excludes = getStandardExclusions(this, includeRootHome)
    let rsyncExcludes = ''
    excludes.forEach(ex => rsyncExcludes += ` --exclude "${ex}"`)
    const sysExcludes = ['/proc/*', '/sys/*', '/dev/*', '/run/*', '/tmp/*', '/mnt/*', '/media/*', '/lost+found']
    sysExcludes.forEach(ex => rsyncExcludes += ` --exclude "${ex}"`)

    script += 'if [ -z "$(ls -A "$MERGED_DIR")" ]; then\n'
    script += '   echo "ERROR: MERGED_DIR ($MERGED_DIR) is empty! Aborting."\n'
    script += '   exit 1\n'
    script += 'fi\n\n'

    script += `rsync -aH --exclude-from="$SNAPSHOT_EXCLUDES" ${rsyncExcludes} "$MERGED_DIR/" "$MNT_DIR/root_mp/"\n\n`

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