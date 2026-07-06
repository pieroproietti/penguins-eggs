package planner

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func BuildMakeImgStep(workPath, finalIsoPath, fdtDir, fdtFile, spacemitDir string) (string, error) {
	// srcDir: where squashfs is located, i.e., /home/eggs/isodir
	srcDir := filepath.Join(workPath, "isodir")
	mntDir := filepath.Join(workPath, "mnt/img")
	fdtDirBootfs := strings.TrimPrefix(fdtDir, "/boot/")
	fdtDirBootfs = strings.TrimPrefix(fdtDirBootfs, "/")

	// read env_k1-x.mustache
	mustachePath := filepath.Join(spacemitDir, "env_k1-x.mustache")
	templateBytes, err := os.ReadFile(mustachePath)
	if err != nil {
		return "", fmt.Errorf("unable to read mustache template from %s: %w", mustachePath, err)
	}

	envContent := string(templateBytes)
	envContent = strings.ReplaceAll(envContent, "{{{fdt_file}}}", fdtFile)
	envContent = strings.ReplaceAll(envContent, "{{{fdt_dir}}}", fdtDirBootfs)
	envContent = strings.ReplaceAll(envContent, "{{{kernel_name}}}", "__KERNEL_NAME__")
	envContent = strings.ReplaceAll(envContent, "{{{initrd_name}}}", "__INITRD_NAME__")

	script := "#!/bin/bash\nset -ex\n\n"
	script += fmt.Sprintf("IMG_NAME=%q\n", finalIsoPath)
	script += fmt.Sprintf("MNT_DIR=%q\n", mntDir)
	script += fmt.Sprintf("SPACEMIT_DIR=%q\n", spacemitDir)
	script += fmt.Sprintf("SRC_DIR=%q\n\n", srcDir)

	script += "# --- 1. CALCOLO DIMENSIONI E CREAZIONE EXT4 VOLUMES ---\n"
	script += "mkdir -p \"$MNT_DIR/img\"\n"
	script += "SQUASH_SIZE=$(du -sm \"$SRC_DIR/live/filesystem.squashfs\" | cut -f1)\n"
	script += "ROOTFS_SIZE=$((SQUASH_SIZE + 1024))\n"
	script += "echo \"Creating bootfs.ext4: 256 MB\"\n"
	script += "dd if=/dev/zero of=\"$MNT_DIR/bootfs.ext4\" bs=1M count=256 status=none\n"
	script += "mkfs.ext4 -L \"bootfs\" -m 0 -q \"$MNT_DIR/bootfs.ext4\"\n"
	script += "echo \"Creating rootfs.ext4: $ROOTFS_SIZE MB\"\n"
	script += "dd if=/dev/zero of=\"$MNT_DIR/rootfs.ext4\" bs=1M count=$ROOTFS_SIZE status=none\n"
	script += "mkfs.ext4 -L \"rootfs\" -m 0 -q \"$MNT_DIR/rootfs.ext4\"\n\n"

	script += "# --- 2. MOUNT VOLUMES ---\n"
	script += "mkdir -p \"$MNT_DIR/bootfs\" \"$MNT_DIR/rootfs\"\n"
	script += "mount -o loop \"$MNT_DIR/bootfs.ext4\" \"$MNT_DIR/bootfs\"\n"
	script += "mount -o loop \"$MNT_DIR/rootfs.ext4\" \"$MNT_DIR/rootfs\"\n\n"

	script += "# --- 3. POPOLAMENTO BOOTFS (KERNEL, DTB, LOGO) ---\n"
	script += "if [ -f \"$SPACEMIT_DIR/bianbu.bmp\" ]; then\n"
	script += "    echo \"Copying boot logo (bianbu.bmp)...\"\n"
	script += "    cp \"$SPACEMIT_DIR/bianbu.bmp\" \"$MNT_DIR/bootfs/\"\n"
	script += "fi\n"
	script += "KERNEL_FILE=$(basename $(find \"$SRC_DIR/live\" -name \"vmlinu*\" | head -n1))\n"
	script += "INITRD_FILE=$(basename $(find \"$SRC_DIR/live\" -name \"initrd*\" | head -n1))\n"
	script += "cp \"$SRC_DIR/live/$KERNEL_FILE\" \"$MNT_DIR/bootfs/\"\n"
	script += "cp \"$SRC_DIR/live/$INITRD_FILE\" \"$MNT_DIR/bootfs/\"\n"
	script += fmt.Sprintf("mkdir -p \"$MNT_DIR/bootfs/%s\"\n", fdtDirBootfs)
	script += fmt.Sprintf("cp -rv %q/* \"$MNT_DIR/bootfs/%s/\"\n\n", fdtDir, fdtDirBootfs)

	script += "# --- 4. SCRITTURA ENV_K1-X.TXT ---\n"
	script += "cat <<'EOF' > \"$MNT_DIR/bootfs/env_k1-x.txt\"\n" + envContent + "\nEOF\n"
	script += "sed -i \"s/__KERNEL_NAME__/$KERNEL_FILE/g\" \"$MNT_DIR/bootfs/env_k1-x.txt\"\n"
	script += "sed -i \"s/__INITRD_NAME__/$INITRD_FILE/g\" \"$MNT_DIR/bootfs/env_k1-x.txt\"\n\n"

	script += "# --- 5. POPOLAMENTO ROOTFS ---\n"
	script += "mkdir -p \"$MNT_DIR/rootfs/live\"\n"
	script += "cp \"$SRC_DIR/live/filesystem.squashfs\" \"$MNT_DIR/rootfs/live/\"\n\n"

	script += "# --- 6. UMOUNT VOLUMES ---\n"
	script += "sync\n"
	script += "umount -R \"$MNT_DIR/bootfs\" || true\n"
	script += "umount -R \"$MNT_DIR/rootfs\" || true\n\n"

	script += "# --- 7. GENIMAGE EXECUTION ---\n"
	script += "echo \"Preparing genimage input directory...\"\n"
	script += "mkdir -p \"$MNT_DIR/input\" \"$MNT_DIR/output\" \"$MNT_DIR/tmp\"\n"
	script += "cp -r \"$SPACEMIT_DIR/\"* \"$MNT_DIR/input/\"\n"
	script += "mv \"$MNT_DIR/bootfs.ext4\" \"$MNT_DIR/input/bootfs.ext4\"\n"
	script += "mv \"$MNT_DIR/rootfs.ext4\" \"$MNT_DIR/input/rootfs.ext4\"\n"
	script += "echo \"Running genimage...\"\n"
	script += "genimage --inputpath \"$MNT_DIR/input\" --outputpath \"$MNT_DIR/output\" --rootpath \"$MNT_DIR/output\" --tmppath \"$MNT_DIR/tmp\" --config \"$MNT_DIR/input/genimage.cfg\"\n"
	script += "echo \"Moving generated image to destination...\"\n"
	script += "mv \"$MNT_DIR/output/sdcard.img\" \"$IMG_NAME\"\n\n"

	script += "# --- 8. CLEANUP ---\n"
	script += "sync\n"
	script += "umount -R \"$MNT_DIR/rootfs\" || true\n"
	script += "umount -R \"$MNT_DIR/bootfs\" || true\n\n"
	script += "echo \"Image created successfully: $IMG_NAME\"\n"

	return script, nil
}
