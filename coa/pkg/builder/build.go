package builder

import (
	"coa/pkg/distro"
	"coa/pkg/utils"
	"fmt"
	"strings"
	"time"

	sysctx "coa/pkg/context"
)

func LogBuild(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	utils.LogNormal("[build] %s", msg)
}

func LogError(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	utils.LogNormal("%s", msg)
}

func getDebianDepends(arch string) string {
	base := "btrfs-progs, curl, dosfstools, git, gpg, libarchive-tools, live-boot, live-boot-initramfs-tools, mtools, rsync, squashfs-tools, sudo, xorriso, yq, qemu-guest-agent"
	switch arch {
	case "amd64", "i386":
		return base + ", grub-efi-amd64-bin, grub-pc-bin"
	case "arm64", "armhf", "armel":
		return base + ", genimage, grub-efi-arm64-bin"
	case "riscv64":
		return base + ", gdisk, genimage"
	default:
		return base + ", genimage"
	}
}

func HandleBuild(d *distro.Distro) {

	// 1. Data preparation
	ctx := sysctx.Detect()
	baseVer, relNum := getGitVersion()
	dist := strings.ToLower(d.DistroLike)
	now := time.Now()
	arch := getDebianArch()
	data := RecipeData{
		BaseVersion: baseVer,
		Rel:         relNum,
		Date:        now.Format(time.RFC1123Z),
		RpmDate:     now.Format("Mon Jan 02 2006"),
		Arch:        arch,
		Depends:     getDebianDepends(arch),
	}

	// 2. staging
	staging(ctx)

	// 3. addBuildRecipe
	recipe(ctx, dist, data)

	// normalize perms: staging/recipe writes are umask-sensitive, packagers aren't
	if err := normalizePerms(ctx.StageDir); err != nil {
		utils.LogWarning("normalizePerms: %v", err)
	}

	// 4. Packager
	packager(ctx, dist, data)
}
