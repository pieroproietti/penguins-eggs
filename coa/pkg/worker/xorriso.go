package worker

import (
	"coa/pkg/pathDefaults"
	"coa/pkg/utils"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func RunXorriso(payload []byte) error {
	var cfg struct {
		Params struct {
			OutputFile  string `json:"output_file"`
			SourceDir   string `json:"source_dir"`
			Volid       string `json:"volid"`
			IsolinuxBin string `json:"isolinux_bin"`
			IsolinuxCat string `json:"isolinux_cat"`
			Isohdpfx    string `json:"isohdpfx"`
			EfiImg      string `json:"efi_img"`
		} `json:"params"`
	}

	if err := json.Unmarshal(payload, &cfg); err != nil {
		return fmt.Errorf("error parsing JSON for xorriso module: %w", err)
	}

	p := cfg.Params

	actualOutput := os.ExpandEnv(p.OutputFile)

	if actualOutput == "" || actualOutput == "${ISO_OUTPUT}" {
		actualOutput = filepath.Join(pathDefaults.DefaultWorkPath, "oa-live.iso")
		utils.LogWarning("[worker] Warning: ISO_OUTPUT not resolved, using fallback: %s", actualOutput)
	}

	actualSource := os.ExpandEnv(p.SourceDir)
	if actualSource == "" {
		actualSource = filepath.Join(pathDefaults.DefaultWorkPath, "isodir")
	}

	if actualOutput == "" || actualSource == "" {
		return fmt.Errorf("xorriso module: 'output_file' and 'source_dir' parameters are invalid")
	}

	if _, err := os.Stat(actualSource); os.IsNotExist(err) {
		return fmt.Errorf("xorriso module: source directory '%s' does not exist", actualSource)
	}

	if p.Volid == "" {
		p.Volid = "OA_LIVE"
	}

	isolinuxPath := ""
	if p.IsolinuxBin != "" {
		isolinuxPath = filepath.Join(actualSource, p.IsolinuxBin)
	}
	hasIsolinux := isolinuxPath != "" && p.Isohdpfx != "" && fileExists(isolinuxPath) && fileExists(p.Isohdpfx)

	efiImgPath := ""
	if p.EfiImg != "" {
		efiImgPath = filepath.Join(actualSource, p.EfiImg)
	}
	hasEfi := efiImgPath != "" && fileExists(efiImgPath)

	if !hasIsolinux && !hasEfi {
		utils.LogWarning("[worker] Warning: neither ISOLINUX nor EFI boot loader was found. The ISO may not boot.")
	}

	args := []string{
		"-as", "mkisofs",
		"-iso-level", "3",
		"-full-iso9660-filenames",
		"-volid", p.Volid,
	}

	if hasIsolinux {
		// Legacy BIOS boot (ISOLINUX)
		args = append(args,
			"-eltorito-boot", p.IsolinuxBin,
			"-eltorito-catalog", p.IsolinuxCat,
			"-no-emul-boot",
			"-boot-load-size", "4",
			"-boot-info-table",
			"-isohybrid-mbr", p.Isohdpfx,
		)
		if hasEfi {
			// UEFI boot as alt-boot
			args = append(args,
				"-eltorito-alt-boot",
				"-e", p.EfiImg,
				"-no-emul-boot",
				"-isohybrid-gpt-basdat",
			)
		}
	} else if hasEfi {
		// Pure UEFI boot (arm64, riscv64, or UEFI-only x86)
		args = append(args,
			"-e", p.EfiImg,
			"-no-emul-boot",
			"-isohybrid-gpt-basdat",
		)
	}

	args = append(args,
		"-o", actualOutput,
		actualSource,
	)

	bootModeStr := "ISO9660"
	if hasIsolinux && hasEfi {
		bootModeStr = "Hybrid BIOS/UEFI"
	} else if hasEfi {
		bootModeStr = "UEFI-only"
	}

	utils.LogNormal("\n[worker] Generating ISO (%s): %s", bootModeStr, actualOutput)
	utils.LogNormal("[worker] Source: %s", actualSource)
	utils.LogNormal("Starting xorriso (this may take a few minutes)...")

	xorrisoCmd := "xorriso " + strings.Join(args, " ")
	if err := utils.Exec(xorrisoCmd); err != nil {
		return fmt.Errorf("xorriso process failed: %w", err)
	}

	utils.LogSuccess("[worker] ISO image created successfully at: %s", actualOutput)
	return nil
}

