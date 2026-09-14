package engine

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"coa/pkg/utils"
)

// findEFIBinary searches dir for a known bootloader executable (.efi).
func findEFIBinary(dir string) string {
	candidates := []string{
		"shimx64.efi", "shimaa64.efi", "shimriscv64.efi", "shimia32.efi",
		"grubx64.efi", "grubaa64.efi", "grubriscv64.efi", "grubia32.efi",
		"systemd-bootx64.efi", "systemd-bootaa64.efi",
		"BOOTX64.EFI", "BOOTAA64.EFI",
	}
	for _, c := range candidates {
		p := filepath.Join(dir, c)
		if info, err := os.Stat(p); err == nil && !info.IsDir() {
			return c
		}
	}
	entries, err := os.ReadDir(dir)
	if err == nil {
		for _, e := range entries {
			if !e.IsDir() && strings.HasSuffix(strings.ToLower(e.Name()), ".efi") {
				return e.Name()
			}
		}
	}
	return ""
}

// RegisterCoexistNVRAM inspects espMount (e.g. /target/boot/efi) and registers the EFI
// bootloader for primaryID on espDevice into UEFI NVRAM using efibootmgr. It also ensures
// any other Coexist EFI installations discovered on that ESP have valid NVRAM entries.
func RegisterCoexistNVRAM(espMount, espDevice, primaryID string) error {
	if !IsUEFI() {
		return nil
	}
	if espDevice == "" {
		return nil
	}
	if _, err := exec.LookPath("efibootmgr"); err != nil {
		return nil
	}
	if _, err := exec.LookPath("lsblk"); err != nil {
		return nil
	}

	out, err := utils.ExecCapture("lsblk -dnro PKNAME,PARTN,PARTUUID " + shellQuote(espDevice))
	if err != nil {
		if _, statErr := os.Stat(espDevice); os.IsNotExist(statErr) {
			return nil
		}
		return fmt.Errorf("probe ESP device %s: %w", espDevice, err)
	}
	fields := strings.Fields(strings.TrimSpace(out))
	if len(fields) < 2 {
		return fmt.Errorf("unable to determine parent disk and partition number for %s", espDevice)
	}
	pkName := fields[0]
	partNum := fields[1]
	diskPath := pkName
	if !strings.HasPrefix(diskPath, "/dev/") {
		diskPath = "/dev/" + diskPath
	}
	espUUID := ""
	if len(fields) >= 3 {
		espUUID = fields[2]
	}

	efiRoot := filepath.Join(espMount, "EFI")
	if _, err := os.Stat(efiRoot); err != nil {
		efiRoot = filepath.Join(espMount, "efi")
	}
	dirs, err := os.ReadDir(efiRoot)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("read ESP EFI directory: %w", err)
	}

	nvramOut, _ := utils.ExecCapture("efibootmgr --verbose")

	// Collect target identities: other coexist installations first, primaryID last.
	var targets []string
	for _, d := range dirs {
		if !d.IsDir() {
			continue
		}
		name := d.Name()
		if strings.EqualFold(name, "BOOT") {
			continue
		}
		if !strings.EqualFold(name, primaryID) {
			targets = append(targets, name)
		}
	}
	if primaryID != "" {
		targets = append(targets, primaryID)
	}

	var errs []error
	for _, id := range targets {
		entryDir := filepath.Join(efiRoot, id)
		binName := findEFIBinary(entryDir)
		if binName == "" {
			continue
		}
		efiRelPath := `\EFI\` + id + `\` + binName

		existing := ParseEFIBootEntries(nvramOut, id, espUUID)
		if len(existing) > 0 {
			if strings.EqualFold(id, primaryID) {
				// Refresh primaryID entry so it is placed at the top of BootOrder
				for _, num := range existing {
					_ = utils.ExecQuiet(fmt.Sprintf("efibootmgr -b %s -B", num))
				}
			} else {
				// Already present in NVRAM for this ESP, skip
				continue
			}
		}

		cmd := fmt.Sprintf("efibootmgr -c -d %s -p %s -L %s -l %s",
			shellQuote(diskPath),
			shellQuote(partNum),
			shellQuote(id),
			shellQuote(efiRelPath),
		)
		if err := utils.ExecQuiet(cmd); err != nil {
			errs = append(errs, fmt.Errorf("failed to register EFI boot entry for %s: %w", id, err))
			utils.LogWarning("Failed to register EFI boot entry for %s: %v", id, err)
		} else {
			utils.LogSuccess("Registered EFI boot entry %q in firmware (%s)", id, efiRelPath)
		}
	}

	return errors.Join(errs...)
}
