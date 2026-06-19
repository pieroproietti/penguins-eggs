package worker

import (
	"coa/pkg/pathDefaults"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

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
		fmt.Printf("⚠️  [worker] Warning: ISO_OUTPUT not resolved, using fallback: %s\n", actualOutput)
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

	if p.IsolinuxBin == "" || p.EfiImg == "" {
		fmt.Println("⚠️  [worker] Warning: boot parameters (isolinux_bin or efi_img) missing. The ISO may not boot.")
	}

	args := []string{
		"-as", "mkisofs",
		"-iso-level", "3",
		"-full-iso9660-filenames",
		"-volid", p.Volid,

		// Legacy boot (ISOLINUX)
		"-eltorito-boot", p.IsolinuxBin,
		"-eltorito-catalog", p.IsolinuxCat,
		"-no-emul-boot",
		"-boot-load-size", "4",
		"-boot-info-table",
		"-isohybrid-mbr", p.Isohdpfx,

		// UEFI boot
		"-eltorito-alt-boot",
		"-e", p.EfiImg,
		"-no-emul-boot",
		"-isohybrid-gpt-basdat",

		"-o", actualOutput,
		actualSource,
	}

	fmt.Printf("\n💿 [worker] Generating hybrid ISO: %s\n", actualOutput)
	fmt.Printf("📁 [worker] Source: %s\n", actualSource)
	fmt.Println("⏳ [worker] Starting xorriso compression (this may take a few minutes)...")

	cmd := exec.Command("xorriso", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("xorriso process failed: %w", err)
	}

	fmt.Printf("✅ [worker] ISO image created successfully at: %s\n", actualOutput)
	return nil
}
