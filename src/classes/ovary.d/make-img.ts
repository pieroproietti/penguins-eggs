/**
 * ./src/classes/ovary.d/make-img.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * Refactored for clarity
 */

import path from 'node:path'
import fs from 'node:fs'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import Diversions from '../diversions.js'
import { getStandardExclusions } from './make-squashfs.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export async function makeImg(this: Ovary, includeRootHome = false) {

    // --- 1. CONFIGURATION & PATHS ---
    const srcDir = path.join(this.nest, 'mnt/iso')
    const mntDir = path.join(this.nest, 'mnt/img')
    const dtbDir = this.dtbDir

    // Naming
    this.settings.isoFilename = this.settings.config.snapshot_prefix + this.volid + '_' + Utils.uefiArch() + Utils.getPostfix() + '.img'
    const imgLnk = this.settings.config.snapshot_dir + this.settings.isoFilename
    const workImg = this.settings.config.snapshot_mnt + this.settings.isoFilename

    const mergedDir = this.settings.work_dir.merged
    const snapshotExcludes = this.settings.config.snapshot_excludes
    const mkfsOptions = '-m 0 -q'

    // Musebook (RISC-V)
    let musebookDir = path.resolve(__dirname, '../../../musebook')
    if (!fs.existsSync(musebookDir)) {
        musebookDir = path.resolve('/usr/share/penguins-eggs/musebook')
    }

    // --- 2. START BUILDING SCRIPT ---
    let script = '#!/bin/bash\n'
    script += 'set -e\n\n'

    // Variables export
    script += `SRC_DIR="${srcDir}"\n`
    script += `DTB_DIR="${dtbDir}"\n`
    script += `IMG_NAME="${workImg}"\n`
    script += `IMG_LNK="${imgLnk}"\n`
    script += `MNT_DIR="${mntDir}"\n`
    script += `MUSEBOOK_DIR="${musebookDir}"\n`
    script += `MERGED_DIR="${mergedDir}"\n`
    script += `SNAPSHOT_EXCLUDES="${snapshotExcludes}"\n`
    script += '\n'

    // Safety checks
    script += 'if [ -d "$IMG_NAME" ]; then echo "ERROR: IMG_NAME is a directory!"; exit 1; fi\n\n'

    // Size Calculation
    script += '# --- 1. CALCOLO DIMENSIONI ---\n'
    script += 'ROOT_SIZE=$(du -sm "$MERGED_DIR" | cut -f1)\n'
    script += 'TOTAL_SIZE=$((ROOT_SIZE + 1536))\n' // Buffer generoso
    script += 'echo "Creating raw image: ${TOTAL_SIZE}MB..."\n'
    script += 'dd if=/dev/zero of="$IMG_NAME" bs=1M count=0 seek=$TOTAL_SIZE status=none\n\n'

    // --- 3. ARCHITECTURE FORK: PARTITIONING & FORMATTING ---
    if (process.arch === 'riscv64') {
        // ==========================================
        // RISC-V (Spacemit K1 / Bianbu)
        // ==========================================
        Utils.warning('make live image (RISC-V Spacemit K1 Native)')

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
        script += `mkfs.ext4 -L "BOOTFS" ${mkfsOptions} "\${LOOP_DEV}p5"\n`
        script += `mkfs.ext4 -L "ROOTFS" ${mkfsOptions} "\${LOOP_DEV}p6"\n\n`

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

    } else if (process.arch === 'x64') {
        // ==========================================
        // x86_64 (UEFI Only)
        // ==========================================
        Utils.warning('make live image (x86_64 UEFI)')

        const bootloaders = Diversions.bootloaders(this.familyId)
        // Usa GRUB monolitico per semplicità in sviluppo
        let grubEfi = path.resolve(bootloaders, `grub/x86_64-efi/monolithic/grubx64.efi`)
        script += `GRUB_EFI="${grubEfi}"\n`

        script += '# --- x86_64 SETUP ---\n'
        script += '# 2. Partizionamento (UEFI Standard)\n'
        script += 'sgdisk -o "$IMG_NAME"\n'
        script += 'sgdisk -n 1:2048:+256M -c 1:"EFI System" -t 1:ef00 "$IMG_NAME"\n' // ESP
        script += 'sgdisk -n 2:0:0        -c 2:"Linux Root" -t 2:8300 "$IMG_NAME"\n\n' // Root

        script += '# 3. Loop & Format\n'
        script += 'LOOP_DEV=$(losetup -fP --show "$IMG_NAME")\n'
        script += 'mkfs.vfat -F32 -n "EFI" "${LOOP_DEV}p1"\n'
        script += `mkfs.ext4 -L "ROOTFS" ${mkfsOptions} "\${LOOP_DEV}p2"\n\n`

        script += '# 4. Mount (UEFI Style)\n'
        // Nota: Montiamo p2 su root_mp (Root) e p1 su boot_mp (ESP)
        script += 'mkdir -p "$MNT_DIR/boot_mp" "$MNT_DIR/root_mp"\n'
        script += 'mount "${LOOP_DEV}p1" "$MNT_DIR/boot_mp"\n'
        script += 'mount "${LOOP_DEV}p2" "$MNT_DIR/root_mp"\n\n'

        script += '# 5. ESP Setup (Loader Stub - Generated via grub-mkimage)\n'
        script += 'mkdir -p "$MNT_DIR/boot_mp/EFI/BOOT"\n'
        // Define modules to bake into the EFI binary (Added: linux, part_gpt, ext2, normal, configfile, etc.)
        const grubModules = 'part_gpt part_msdos fat ext2 iso9660 search search_fs_uuid search_label file configfile normal linux boot all_video gfxterm gettext help scsi ata ahci echo ls cat reboot minicmd nativedisk regexp test'
        script += `grub-mkimage -O x86_64-efi -o "$MNT_DIR/boot_mp/EFI/BOOT/BOOTX64.EFI" -p "/EFI/BOOT" ${grubModules}\n`

        // Config file alongside binary in ESP
        script += 'cat <<EOF > "$MNT_DIR/boot_mp/EFI/BOOT/grub.cfg"\n'
        script += 'set timeout=5\n'
        script += 'set debug=all\n' // Temporary debug
        script += 'echo "Prefix: $prefix"\n'
        script += 'echo "Root: $root"\n'
        script += 'echo "Attempting to find ROOTFS..."\n'
        script += 'search --no-floppy --set=root --label ROOTFS\n'
        script += 'if [ -z "$root" ]; then\n'
        script += '    echo "ROOTFS not found via label. Searching via likely partitions..."\n'
        script += '    search --no-floppy --set=root --file /boot/grub/grub.cfg\n'
        script += 'fi\n'
        script += 'if [ -z "$root" ]; then\n'
        script += '    echo "ERROR: Root partition not found!"\n'
        script += '    ls\n'
        script += '    sleep 10\n'
        script += 'else\n'
        script += '    echo "Found root at: $root"\n'
        script += '    set prefix=($root)/boot/grub\n'
        script += '    configfile ($root)/boot/grub/grub.cfg\n'
        script += 'fi\n'
        script += 'EOF\n\n'

    } else {
        Utils.error(`Architecture ${process.arch} not supported`)
        process.exit(1)
    }

    // --- 4. COMMON: RSYNC ROOTFS ---
    // A questo punto, indipendentemente dall'architettura:
    // $MNT_DIR/root_mp è montato sulla partizione di root ext4 target.

    script += '# --- COPIA FILESYSTEM (RSYNC) ---\n'
    script += 'echo "Rsyncing filesystem..."\n'

    const excludes = getStandardExclusions(this, includeRootHome)
    let rsyncExcludes = ''
    excludes.forEach(ex => rsyncExcludes += ` --exclude "${ex}"`)

    // Esclusioni standard di sistema
    const sysExcludes = ['/proc/*', '/sys/*', '/dev/*', '/run/*', '/tmp/*', '/mnt/*', '/media/*', '/lost+found']
    sysExcludes.forEach(ex => rsyncExcludes += ` --exclude "${ex}"`)

    // Check MERGED_DIR
    script += 'if [ -z "$(ls -A "$MERGED_DIR")" ]; then\n'
    script += '   echo "ERROR: MERGED_DIR ($MERGED_DIR) is empty! Aborting."\n'
    script += '   exit 1\n'
    script += 'fi\n\n'

    script += `rsync -avH --exclude-from="$SNAPSHOT_EXCLUDES" ${rsyncExcludes} "$MERGED_DIR/" "$MNT_DIR/root_mp/"\n\n`


    // --- 5. ARCHITECTURE SPECIFIC: POST-COPY CONFIG ---
    // Qui gestiamo fstab e grub.cfg reale (che stanno dentro root_mp)

    script += '# --- POST-CONFIG ---\n'

    if (process.arch === 'riscv64') {
        // RISC-V: Add Extlinux (syslinux style) for generic U-Boot support
        script += 'mkdir -p "$MNT_DIR/boot_mp/extlinux"\n'
        script += 'cat <<EOF > "$MNT_DIR/boot_mp/extlinux/extlinux.conf"\n'
        script += 'label linux\n'
        script += '    linux /${KERNEL_FULL}\n'
        script += '    initrd /${INITRD_BIN}\n'
        script += '    fdtdir /spacemit/${KERNEL_VER}/\n'
        script += '    append root=LABEL=ROOTFS rw rootwait console=ttyS0,115200 earlycon=sbi clk_ignore_unused\n'
        script += 'EOF\n\n'

        // Also ensure we have fstab for RISC-V
        script += 'mkdir -p "$MNT_DIR/root_mp/etc"\n'
        script += 'echo "LABEL=ROOTFS  /          ext4  errors=remount-ro  0  1" > "$MNT_DIR/root_mp/etc/fstab"\n'
        script += 'echo "LABEL=BOOTFS  /boot      ext4  defaults           0  2" >> "$MNT_DIR/root_mp/etc/fstab"\n'

    } else if (process.arch === 'x64') {
        script += '# --- x86_64 POST-CONFIG ---\n'

        // 1. Fstab
        script += 'mkdir -p "$MNT_DIR/root_mp/etc"\n'
        script += 'echo "LABEL=ROOTFS  /          ext4  errors=remount-ro  0  1" > "$MNT_DIR/root_mp/etc/fstab"\n'
        script += 'echo "LABEL=EFI     /boot/efi  vfat  umount=0077        0  1" >> "$MNT_DIR/root_mp/etc/fstab"\n'

        // 2. Real Grub Config in /boot/grub (dentro la root)
        script += 'mkdir -p "$MNT_DIR/root_mp/boot/grub/x86_64-efi"\n'
        script += 'cp -r /usr/lib/grub/x86_64-efi/*.mod "$MNT_DIR/root_mp/boot/grub/x86_64-efi/"\n'
        script += 'cp -r /usr/lib/grub/x86_64-efi/*.lst "$MNT_DIR/root_mp/boot/grub/x86_64-efi/"\n'

        // Cerchiamo il kernel copiato via rsync (che era in merged_dir)
        script += 'KERNEL=$(basename $(find "$MNT_DIR/root_mp/boot" -name "vmlinuz-*" | head -n1))\n'
        script += 'INITRD=$(basename $(find "$MNT_DIR/root_mp/boot" -name "initrd.img-*" | head -n1))\n'

        script += 'cat <<EOF > "$MNT_DIR/root_mp/boot/grub/grub.cfg"\n'
        script += 'set timeout=5\n'
        script += 'set default=0\n'
        script += 'insmod all_video\n'
        script += 'insmod gfxterm\n'
        script += 'menuentry "Penguins Eggs (x86_64)" {\n'
        script += '    search --no-floppy --set=root --label ROOTFS\n'
        script += '    linux /boot/$KERNEL root=LABEL=ROOTFS rw quiet splash\n'
        script += '    initrd /boot/$INITRD\n'
        script += '}\n'
        script += 'EOF\n\n'
    }

    // --- 6. CLEANUP & FINALIZATION ---
    script += '# --- CLEANUP ---\n'
    script += 'umount -R "$MNT_DIR/root_mp" || true\n'
    script += 'umount -R "$MNT_DIR/boot_mp" || true\n' // -R per sicurezza se ci sono bind mount
    script += 'losetup -d "$LOOP_DEV"\n\n'

    // Bootloader raw writing (RISC-V only needs this after umount)
    if (process.arch === 'riscv64') {
        script += '# --- RISC-V BOOTLOADER INJECTION ---\n'
        script += 'if [ -f "$MUSEBOOK_DIR/spl.bin" ] && [ -f "$MUSEBOOK_DIR/uboot.itb" ]; then\n'
        script += '    dd if="$MUSEBOOK_DIR/spl.bin" of="$IMG_NAME" bs=512 seek=256 conv=notrunc status=none\n'
        script += '    dd if="$MUSEBOOK_DIR/uboot.itb" of="$IMG_NAME" bs=512 seek=2048 conv=notrunc status=none\n'
        script += 'else\n'
        script += '    echo "WARNING: Bootloader files missing!"\n'
        script += 'fi\n'
    }

    script += 'ln -sf "$IMG_NAME" "$IMG_LNK"\n'
    script += 'echo "Image created successfully: $IMG_LNK"\n'

    // Write Script
    const mkImg = path.join(this.settings.work_dir.bin, 'mkimg')
    Utils.writeX(mkImg, script)

    return mkImg
}