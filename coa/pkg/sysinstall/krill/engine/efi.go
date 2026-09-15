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

var installationIDPattern = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{0,14}[a-z0-9])?$`)

func ValidateInstallationID(id string) error {
	if !installationIDPattern.MatchString(id) {
		return fmt.Errorf("Installation ID must be 1–16 ASCII lowercase letters, digits or hyphens, and start and end with a letter or digit")
	}
	if IsGenericRootLabel(id) {
		return fmt.Errorf("Installation ID cannot be root or rootN (reserved empty-slot labels)")
	}
	return nil
}

// Debian lowercases GRUB_DISTRIBUTOR and aliases kubuntu/devuan during upgrades.
// Require an ID that is stable under that transformation; BOOT is shared.
func ValidateEFIBootloaderID(id string) error {
	if err := ValidateInstallationID(id); err != nil {
		return err
	}
	if id == "boot" || id == "kubuntu" || id == "devuan" {
		return fmt.Errorf("Installation ID cannot be boot, kubuntu or devuan (reserved EFI IDs)")
	}
	return nil
}

// Read only: allow reuse of the selected directory, but reject unsafe paths.
// FAT names compare case-insensitively, including the EFI component.
func efiDestinationState(esp, id string) error {
	if err := ValidateEFIBootloaderID(id); err != nil {
		return err
	}
	found := false
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
				if !child.IsDir() {
					return fmt.Errorf("EFI destination %q is not a directory", child.Name())
				}
				if found {
					return fmt.Errorf("multiple EFI destinations match %q", id)
				}
				found = true
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
	return efiDestinationState(dir, id)
}
