package engine

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"unicode"

	"coa/pkg/utils"
)

var efiBootEntryPattern = regexp.MustCompile(`(?i)^Boot([0-9a-fA-F]{4})\*?\s+(.*)$`)
var efiPartitionPattern = regexp.MustCompile(`(?i)HD\([0-9]+,GPT,([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}),`)
var partitionUUIDPattern = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

// ParseEFIBootEntries matches both the installation identity and the selected
// ESP's GPT partition UUID. Entries without a verifiable device path are kept.
func ParseEFIBootEntries(output, id, espUUID string) []string {
	if id == "" || !partitionUUIDPattern.MatchString(espUUID) {
		return nil
	}
	var toDelete []string
	idLower := strings.ToLower(id)
	for _, line := range strings.Split(output, "\n") {
		line = strings.TrimSpace(line)
		matches := efiBootEntryPattern.FindStringSubmatch(line)
		if len(matches) == 3 {
			num := matches[1]
			desc := strings.ToLower(matches[2])
			partition := efiPartitionPattern.FindStringSubmatch(desc)
			if len(partition) != 2 || !strings.EqualFold(partition[1], espUUID) {
				continue
			}
			// Match an exact label (the device path follows a tab), never a
			// description prefix such as "arch backup" belonging to another OS.
			label, _, _ := strings.Cut(desc, "\t")
			if strings.TrimSpace(label) == idLower ||
				strings.Contains(desc, `\efi\`+idLower+`\`) || strings.Contains(desc, `/efi/`+idLower+`/`) {
				toDelete = append(toDelete, num)
			}
		}
	}
	return toDelete
}

// CleanCoexistNVRAM removes only entries associated with id on espDevice.
func CleanCoexistNVRAM(espDevice, id string) error {
	if err := ValidateEFIBootloaderID(id); err != nil {
		return err
	}
	out, err := utils.ExecCapture("efibootmgr --verbose")
	if err != nil {
		// Tolerant: system might not have EFI variables mounted or efibootmgr might not be supported.
		return nil
	}
	espUUID, err := utils.ExecCapture("lsblk -dnro PARTUUID " + shellQuote(espDevice))
	if err != nil {
		return fmt.Errorf("read Coexist ESP PARTUUID: %w", err)
	}
	espUUID = strings.TrimSpace(espUUID)
	if !partitionUUIDPattern.MatchString(espUUID) {
		return fmt.Errorf("invalid Coexist ESP PARTUUID on %s", espDevice)
	}
	entries := ParseEFIBootEntries(out, id, espUUID)
	var errs []error
	for _, entry := range entries {
		if err := utils.ExecQuiet(fmt.Sprintf("efibootmgr -b %s -B", entry)); err != nil {
			errs = append(errs, fmt.Errorf("failed to delete NVRAM boot entry %s: %w", entry, err))
		}
	}
	return errors.Join(errs...)
}

// CleanCoexistESPMount removes EFI/<id> from a mounted ESP directory, strictly preserving EFI/BOOT and siblings.
func CleanCoexistESPMount(espMount, id string) error {
	if err := ValidateEFIBootloaderID(id); err != nil {
		return err
	}
	entries, err := os.ReadDir(espMount)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if !entry.IsDir() || !strings.EqualFold(entry.Name(), "EFI") {
			continue
		}
		efiDir := filepath.Join(espMount, entry.Name())
		children, err := os.ReadDir(efiDir)
		if err != nil {
			return err
		}
		for _, child := range children {
			if strings.EqualFold(child.Name(), id) {
				target := filepath.Join(efiDir, child.Name())
				info, err := os.Lstat(target)
				if err != nil {
					return err
				}
				if info.Mode()&os.ModeSymlink != 0 || !info.IsDir() {
					return fmt.Errorf("unsafe EFI destination %s", target)
				}
				if err := os.RemoveAll(target); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

// CleanCoexistESP mounts the given ESP partition, cleans EFI/<id> and unmounts it.
func CleanCoexistESP(espDevice, id string) (result error) {
	if err := ValidateEFIBootloaderID(id); err != nil {
		return err
	}
	dir, err := os.MkdirTemp("", "krill-esp-clean-")
	if err != nil {
		return err
	}
	defer func() { result = errors.Join(result, os.Remove(dir)) }()
	if err := utils.ExecQuiet("mount -t vfat " + shellQuote(espDevice) + " " + shellQuote(dir)); err != nil {
		return fmt.Errorf("mount ESP %s: %w", espDevice, err)
	}
	defer func() { result = errors.Join(result, utils.ExecQuiet("umount "+shellQuote(dir))) }()

	if err := CleanCoexistESPMount(dir, id); err != nil {
		return err
	}
	return CleanCoexistNVRAM(espDevice, id)
}

// CleanCoexistHomeMount removes /<id> from a mounted shared HOME directory, strictly preserving /common and siblings.
func CleanCoexistHomeMount(homeMount, id string) error {
	if err := ValidateHomeNamespace(id); err != nil {
		return err
	}
	target := filepath.Join(homeMount, id)
	info, err := os.Lstat(target)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.IsDir() {
		return fmt.Errorf("unsafe HOME namespace %s", target)
	}
	return os.RemoveAll(target)
}

// CleanCoexistHome mounts the given shared HOME partition, removes /<id> and unmounts it.
func CleanCoexistHome(homeDevice, id string) (result error) {
	if err := ValidateHomeNamespace(id); err != nil {
		return err
	}
	dir, err := os.MkdirTemp("", "krill-home-clean-")
	if err != nil {
		return err
	}
	defer func() { result = errors.Join(result, os.Remove(dir)) }()
	if err := utils.ExecQuiet("mount -t ext4 " + shellQuote(homeDevice) + " " + shellQuote(dir)); err != nil {
		return fmt.Errorf("mount SHARED_HOMES %s: %w", homeDevice, err)
	}
	defer func() { result = errors.Join(result, utils.ExecQuiet("umount "+shellQuote(dir))) }()

	return CleanCoexistHomeMount(dir, id)
}

// SlotLabelForPartition calculates the default neutral label (e.g. root1, root2) from partition number.
func SlotLabelForPartition(rootDevice string) string {
	idx := len(rootDevice)
	for idx > 0 && unicode.IsDigit(rune(rootDevice[idx-1])) {
		idx--
	}
	if idx < len(rootDevice) {
		if partNum, err := strconv.Atoi(rootDevice[idx:]); err == nil && partNum >= 2 {
			return fmt.Sprintf("root%d", partNum-1)
		}
	}
	return "root"
}

// IsGenericRootLabel checks if a label is a clean unassigned slot label like "root1", "root2", etc.
func IsGenericRootLabel(label string) bool {
	matched, _ := regexp.MatchString(`^root\d+$`, label)
	return matched || label == "root"
}

// ResetCoexistSlot wipes filesystem signatures on the root partition and reformats it with a generic root label.
func ResetCoexistSlot(rootDevice string) error {
	inUse, err := deviceInUse(rootDevice)
	if err != nil {
		return fmt.Errorf("check in use %s: %w", rootDevice, err)
	}
	if inUse {
		return fmt.Errorf("root partition %s is in use", rootDevice)
	}
	label := SlotLabelForPartition(rootDevice)
	if err := utils.ExecQuiet("wipefs -a " + shellQuote(rootDevice)); err != nil {
		return fmt.Errorf("wipefs %s: %w", rootDevice, err)
	}
	if err := utils.ExecQuiet("mkfs.ext4 -F -L " + shellQuote(label) + " " + shellQuote(rootDevice)); err != nil {
		return fmt.Errorf("format root %s: %w", rootDevice, err)
	}
	return utils.ExecQuiet("udevadm settle")
}

// RemoveCoexistInstallation completely removes an installed distribution:
// 1. Cleans EFI/<id> and deletes its NVRAM boot entries.
// 2. Cleans /<id> on SHARED_HOMES.
// 3. Wipes and reformats the root slot back to generic label rootN.
func RemoveCoexistInstallation(espDevice, homeDevice, rootDevice, id string) error {
	if id == "" {
		return fmt.Errorf("identity cannot be empty")
	}
	var errs []error
	if espDevice != "" {
		if err := CleanCoexistESP(espDevice, id); err != nil {
			errs = append(errs, fmt.Errorf("clean ESP: %w", err))
		}
	}
	if homeDevice != "" {
		if err := CleanCoexistHome(homeDevice, id); err != nil {
			errs = append(errs, fmt.Errorf("clean HOME: %w", err))
		}
	}
	if rootDevice != "" {
		if err := ResetCoexistSlot(rootDevice); err != nil {
			errs = append(errs, fmt.Errorf("reset slot: %w", err))
		}
	}
	return errors.Join(errs...)
}
