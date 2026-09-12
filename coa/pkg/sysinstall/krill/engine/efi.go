package engine

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"coa/pkg/utils"
)

var efiIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]{0,63}$`)

// Debian lowercases GRUB_DISTRIBUTOR and aliases kubuntu/devuan during upgrades.
// Require an ID that is stable under that transformation.
func ValidateEFIBootloaderID(id string) error {
	if !efiIDPattern.MatchString(id) || id == "boot" || id == "kubuntu" || id == "devuan" {
		return fmt.Errorf("EFI bootloader ID must be 1–64 lowercase letters, digits, hyphens or underscores, start with a letter or digit, and not be boot, kubuntu or devuan")
	}
	return nil
}

// Read only: FAT names collide case-insensitively, including the EFI component.
func efiDestinationAbsent(esp, id string) error {
	if err := ValidateEFIBootloaderID(id); err != nil {
		return err
	}
	entries, err := os.ReadDir(esp)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if !strings.EqualFold(entry.Name(), "EFI") {
			continue
		}
		if !entry.IsDir() {
			return fmt.Errorf("EFI path is not a directory")
		}
		children, err := os.ReadDir(filepath.Join(esp, entry.Name()))
		if err != nil {
			return err
		}
		for _, child := range children {
			if strings.EqualFold(child.Name(), id) {
				return fmt.Errorf("EFI destination %q already exists; refusing to merge or overwrite", child.Name())
			}
		}
	}
	return nil
}

func inspectEFIPartition(device, id string) (result error) {
	dir, err := os.MkdirTemp("", "krill-efi-check-")
	if err != nil {
		return err
	}
	defer func() { result = errors.Join(result, os.Remove(dir)) }()
	if err := utils.ExecQuiet("mount -t vfat -o ro " + shellQuote(device) + " " + shellQuote(dir)); err != nil {
		return err
	}
	defer func() { result = errors.Join(result, utils.ExecQuiet("umount "+shellQuote(dir))) }()
	return efiDestinationAbsent(dir, id)
}
