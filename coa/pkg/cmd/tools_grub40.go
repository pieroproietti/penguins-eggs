package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coa/pkg/distro"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var writeToGrub bool

var grub40Cmd = &cobra.Command{
	Use:   "grub40 [path/to/iso]",
	Short: "Generate GRUB configuration to boot ANY ISO via loopback",
	Long:  `Inspects any Linux ISO via bsdtar, automatically extracts its native Kernel path, Initrd path, and boot parameters, and generates or injects the perfect GRUB configuration block.`,
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {

		isoPath := args[0]

		absPath, err := filepath.Abs(isoPath)
		if err != nil {
			utils.Fatal("Error calculating absolute path: %v", err)
		}

		info, err := os.Stat(absPath)
		if err != nil {
			utils.Fatal("Error: cannot access file (are you sure it exists?): %v", err)
		}

		sizeBytes := info.Size()
		var sizeStr string
		if sizeBytes >= 1024*1024*1024 {
			sizeStr = fmt.Sprintf("%.2f GB", float64(sizeBytes)/(1024*1024*1024))
		} else {
			sizeStr = fmt.Sprintf("%.2f MB", float64(sizeBytes)/(1024*1024))
		}

		isoName := filepath.Base(absPath)

		grubPath := calculateGrubPath(absPath)

		detectBootloader()

		updateCmd := "sudo grub-mkconfig -o /boot/grub/grub.cfg"
		d := distro.NewDistro()
		distroID := strings.ToLower(d.DistroLike)
		if distroID == "debian" {
			updateCmd = "sudo update-grub"
		} else if distroID == "fedora" || distroID == "opensuse" {
			updateCmd = "sudo grub-mkconfig -o /boot/grub2/grub.cfg"
		}

		kernelPath, initrdPath, kernelParams, useLoopbackCfg := inspectGenericIso(absPath)

		startMarker := fmt.Sprintf("# >>> oa-tools start: %s <<<", isoName)
		endMarker := fmt.Sprintf("# >>> oa-tools end: %s <<<", isoName)

		var grubEntry string
		if useLoopbackCfg {
			grubEntry = fmt.Sprintf(`%s
menuentry "oa-tools: %s (via loopback.cfg)" --class isoboot {
    insmod part_gpt
    insmod part_msdos
    insmod ext2
    insmod btrfs
    insmod iso9660
    insmod loopback

    set isofile="%s"
    search --no-floppy --set=root --file $isofile
    loopback loop $isofile
    
    set iso_path=$isofile
    export iso_path
    configfile (loop)/boot/grub/loopback.cfg
}
%s`, startMarker, isoName, grubPath, endMarker)
		} else {
			grubEntry = fmt.Sprintf(`%s
menuentry "oa-tools: %s" --class isoboot {
    insmod part_gpt
    insmod part_msdos
    insmod ext2
    insmod btrfs
    insmod iso9660
    insmod loopback
    insmod probe

    set isofile="%s"

    search --no-floppy --set=root --file $isofile
    probe -u $root --set=rootuuid
    set imgdevpath="/dev/disk/by-uuid/$rootuuid"

    loopback loop $isofile

    linux (loop)%s %s
    initrd (loop)%s
}
%s`, startMarker, isoName, grubPath, kernelPath, kernelParams, initrdPath, endMarker)
		}

		if writeToGrub {
			if os.Geteuid() != 0 {
				utils.Fatal("Automatic injection requires root privileges. Rerun the command with 'sudo'.")
			}

			targetFile := "/etc/grub.d/40_custom"

			contentBytes, err := os.ReadFile(targetFile)
			var content string
			if err != nil {
				content = "#!/bin/sh\nexec tail -n +3 $0\n# This file provides an easy way to add custom menu entries.  Simply type the\n# menu entries you want to add after this comment.  Be careful not to change\n# the 'exec tail' line above.\n"
			} else {
				content = string(contentBytes)
			}

			if strings.Contains(content, startMarker) && strings.Contains(content, endMarker) {
				startIndex := strings.Index(content, startMarker)
				endIndex := strings.Index(content, endMarker) + len(endMarker)
				content = content[:startIndex] + content[endIndex:]
			}

			content = strings.TrimSpace(content) + "\n\n" + grubEntry + "\n"

			err = os.WriteFile(targetFile, []byte(content), 0755)
			if err != nil {
				utils.Fatal("Write failed on %s: %v", targetFile, err)
			}

			utils.LogSuccess("Entry for '%s' configured successfully in %s.", isoName, targetFile)
			utils.LogNormal("To apply the changes run: '%s'", updateCmd)

		} else {
			grubTemplate := `
# oa-tools %s
# Add to /etc/grub.d/40_custom or run with '--write' to inject automatically.
# Update GRUB with: '%s'
#
# File: %s
# Detected size: %s

` + grubEntry + "\n"
			utils.LogNormal(grubTemplate, AppVersion, updateCmd, isoName, sizeStr)
		}
	},
}

func inspectGenericIso(isoPath string) (kernel, initrd, params string, useLoopbackCfg bool) {
	checkCmd := fmt.Sprintf("bsdtar -O -xf '%s' boot/grub/loopback.cfg 2>/dev/null", isoPath)
	outCheck, _ := utils.ExecCapture(checkCmd)
	if len(strings.TrimSpace(outCheck)) > 0 {
		return "", "", "", true
	}

	targets := []string{
		"boot/grub/grub.cfg",
		"EFI/BOOT/grub.cfg",
		"efi/boot/grub.cfg",
		"isolinux/isolinux.cfg",
		"boot/syslinux/syslinux.cfg",
		"boot/x86_64/loader/grub.cfg",
		"boot/x86_64/loader/isolinux.cfg",
	}

	var configText string
	for _, target := range targets {
		cmdStr := fmt.Sprintf("bsdtar -O -xf '%s' '%s' 2>/dev/null", isoPath, target)
		out, _ := utils.ExecCapture(cmdStr)

		if len(strings.TrimSpace(out)) > 0 {
			configText = out
			break
		}
	}

	if configText == "" {
		return "/live/vmlinuz", "/live/initrd.img", "boot=live components rootwait findiso=$isofile", false
	}

	lines := strings.Split(configText, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)

		if strings.HasPrefix(line, "linux ") || strings.HasPrefix(line, "linuxefi ") || strings.HasPrefix(line, "kernel ") {
			fields := strings.Fields(line)
			if len(fields) > 1 {
				kernel = fields[1]
				kernel = strings.TrimPrefix(kernel, "/@")
				if !strings.HasPrefix(kernel, "/") {
					kernel = "/" + kernel
				}
				params = strings.Join(fields[2:], " ")
			}
		}

		if strings.HasPrefix(line, "initrd ") || strings.HasPrefix(line, "initrdefi ") {
			fields := strings.Fields(line)
			if len(fields) > 1 {
				initrd = fields[1]
				initrd = strings.TrimPrefix(initrd, "/@")
				if !strings.HasPrefix(initrd, "/") {
					initrd = "/" + initrd
				}
			}
		}
	}

	if kernel != "" {
		if strings.Contains(params, "archisobasedir") {
			params = "archisobasedir=arch archisolabel=OA_LIVE img_dev=$imgdevpath img_loop=$isofile cow_spacesize=2G"
		} else if strings.Contains(params, "rd.live.image") || strings.Contains(params, "root=live:") {
			params = "root=live:CDLABEL=OA_LIVE rd.live.image iso-scan.iso=$isofile rootwait"
		} else if strings.Contains(params, "alpine_dev") || strings.Contains(configText, "alpine") {
			params = "alpine_dev=loop img_loop=$isofile modules=loop,squashfs,sd-mod,usb-storage quiet"
		} else if strings.Contains(params, "boot=casper") {
			params = "boot=casper iso-scan/filename=$isofile quiet splash"
		} else {
			if !strings.Contains(params, "findiso=") {
				params = "boot=live components rootwait findiso=$isofile"
			}
		}
		return kernel, initrd, params, false
	}

	return "/live/vmlinuz", "/live/initrd.img", "boot=live components rootwait findiso=$isofile", false
}

func calculateGrubPath(absPath string) string {
	data, err := os.ReadFile("/proc/mounts")
	if err != nil {
		return absPath
	}

	type Mount struct {
		Point   string
		FSType  string
		Options []string
	}

	var mounts []Mount
	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) < 4 {
			continue
		}
		mounts = append(mounts, Mount{
			Point:   fields[1],
			FSType:  fields[2],
			Options: strings.Split(fields[3], ","),
		})
	}

	var bestMatch Mount
	bestMatchLen := -1

	for _, m := range mounts {
		if m.Point == "/" {
			if bestMatchLen < 0 {
				bestMatch = m
				bestMatchLen = 0
			}
		} else if strings.HasPrefix(absPath, m.Point) {
			if len(absPath) == len(m.Point) || absPath[len(m.Point)] == '/' {
				if len(m.Point) > bestMatchLen {
					bestMatch = m
					bestMatchLen = len(m.Point)
				}
			}
		}
	}

	if bestMatchLen == -1 {
		return absPath
	}

	relPath := absPath
	if bestMatch.Point != "/" {
		relPath = strings.TrimPrefix(absPath, bestMatch.Point)
	}
	if !strings.HasPrefix(relPath, "/") {
		relPath = "/" + relPath
	}

	if bestMatch.FSType == "btrfs" {
		subvol := ""
		for _, opt := range bestMatch.Options {
			if strings.HasPrefix(opt, "subvol=") {
				subvol = strings.TrimPrefix(opt, "subvol=")
				break
			}
		}
		if subvol != "" && subvol != "/" {
			subvol = strings.TrimSuffix(subvol, "/")
			return subvol + relPath
		}
	}

	return relPath
}

func detectBootloader() {
	_, errGrub := os.Stat("/boot/grub")
	_, errGrub2 := os.Stat("/boot/grub2")

	if os.IsNotExist(errGrub) && os.IsNotExist(errGrub2) {
		utils.LogWarning("GRUB directory was not found in /boot. This host does not seem to use GRUB.")
		utils.LogNormal("The configuration below is generated anyway, but it will only work on a GRUB-managed target machine.")
	}
}

func init() {
	grub40Cmd.Flags().BoolVarP(&writeToGrub, "write", "w", false, "Inject the menu entry directly into /etc/grub.d/40_custom")
	toolsCmd.AddCommand(grub40Cmd)
}
