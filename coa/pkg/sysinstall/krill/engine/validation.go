package engine

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coa/pkg/distro"
	"coa/pkg/utils"
)

// IsUEFI tests the running firmware, independently of the disk's partition table.
func IsUEFI() bool {
	info, err := os.Stat("/sys/firmware/efi")
	return err == nil && info.IsDir()
}

// partitionChecks keeps safety probes testable without accessing real disks.
type partitionChecks struct {
	rootTarget  func(string) error
	sharedHome  func() (string, error)
	uefi        func() bool
	partition   func(string) (string, error)
	esp         func(string) (bool, error)
	inUse       func(string) (bool, error)
	filesystem  func(string) (filesystemInfo, error)
	inspectHome func(string, string) error
	family      func() string
	inspectEFI  func(string, string) error
	identities  func(*Plan) error
	disk        func(string, string, string) error
}

func (c *ctx) safetyChecks() partitionChecks {
	if c.checks != nil {
		return *c.checks
	}
	return livePartitionChecks()
}

func livePartitionChecks() partitionChecks {
	return partitionChecks{
		rootTarget:  inspectRootTarget,
		sharedHome:  DetectSharedHome,
		uefi:        IsUEFI,
		partition:   canonicalPartition,
		esp:         isESP,
		inUse:       deviceInUse,
		filesystem:  probeFilesystem,
		inspectHome: inspectHomePartition,
		family:      func() string { return distro.NewDistro().FamilyID },
		inspectEFI:  inspectEFIPartition,
		identities:  inspectCoexistIdentities,
		disk:        inspectCoexistDisk,
	}
}

// Inspect only the selected disk. ROOT and the unique valid ESP must be direct
// partitions of it; shared HOME is deliberately allowed on another disk.
func inspectCoexistDisk(device, root, esp string) error {
	device, err := filepath.EvalSymlinks(device)
	if err != nil {
		return err
	}
	out, err := utils.ExecCapture("lsblk --json --tree --output PATH,TYPE,PARTTYPE,FSTYPE " + shellQuote(device))
	if err != nil {
		return err
	}
	return validateCoexistDiskTree(device, root, esp, out)
}

func validateCoexistDiskTree(device, root, esp, output string) error {
	type block struct {
		Path     string  `json:"path"`
		Type     string  `json:"type"`
		PartType string  `json:"parttype"`
		FsType   string  `json:"fstype"`
		Children []block `json:"children"`
	}
	var tree struct {
		Devices []block `json:"blockdevices"`
	}
	if err := json.Unmarshal([]byte(output), &tree); err != nil {
		return err
	}
	if len(tree.Devices) != 1 || tree.Devices[0].Type != "disk" || tree.Devices[0].Path != device {
		return fmt.Errorf("Coexist requires a single selected disk")
	}
	rootFound, espFound, espCount := false, false, 0
	for _, part := range tree.Devices[0].Children {
		if part.Type != "part" {
			continue
		}
		if part.Path == root {
			if strings.EqualFold(part.PartType, "c12a7328-f81f-11d2-ba4b-00a0c93ec93b") {
				return fmt.Errorf("Coexist cannot use an ESP as root")
			}
			rootFound = true
		}
		if IsCoexistESP(part.PartType, part.FsType) {
			espCount++
			espFound = espFound || part.Path == esp
		}
	}
	if !rootFound {
		return fmt.Errorf("Coexist root must be an existing partition on selected disk %s", device)
	}
	if espCount != 1 || !espFound {
		return fmt.Errorf("Coexist requires the unique valid ESP on selected disk %s", device)
	}
	return nil
}

func canonicalPartition(path string) (string, error) {
	resolved, err := filepath.EvalSymlinks(path)
	if err != nil {
		return "", err
	}
	resolved, err = filepath.Abs(resolved)
	if err != nil {
		return "", err
	}
	info, err := os.Stat(resolved)
	if err != nil {
		return "", err
	}
	if info.Mode()&os.ModeDevice == 0 || info.Mode()&os.ModeCharDevice != 0 {
		return "", fmt.Errorf("%s is not a block device", path)
	}
	if _, err := os.Stat(filepath.Join("/sys/class/block", filepath.Base(resolved), "partition")); err != nil {
		return "", fmt.Errorf("%s is not an existing partition: %w", path, err)
	}
	return resolved, nil
}

func isESP(path string) (bool, error) {
	quoted := "'" + strings.ReplaceAll(path, "'", "'\"'\"'") + "'"
	out, err := utils.ExecCapture("lsblk -dnro PARTTYPE,FSTYPE " + quoted)
	if err != nil {
		return false, fmt.Errorf("lsblk ESP inspection for %s failed: %w", path, err)
	}
	return parseESPProperties(path, out)
}

// IsCoexistESP is shared by TUI selection and preflight. Discovery heuristics
// (labels, mountpoints or MBR types) are not sufficient for Coexist.
func IsCoexistESP(partType, fsType string) bool {
	return strings.EqualFold(strings.TrimSpace(partType), "c12a7328-f81f-11d2-ba4b-00a0c93ec93b") &&
		strings.EqualFold(strings.TrimSpace(fsType), "vfat")
}

func parseESPProperties(path, out string) (bool, error) {
	fields := strings.Fields(out)
	if len(fields) != 2 {
		return false, fmt.Errorf("lsblk ESP inspection for %s: expected PARTTYPE and FSTYPE, got %q", path, strings.TrimSpace(out))
	}
	return IsCoexistESP(fields[0], fields[1]), nil
}

// ValidateCoexistFamily is also used before offering destructive disk preparation.
func ValidateCoexistFamily(family string) error {
	if family != "debian" && family != "archlinux" && family != "manjaro" {
		return fmt.Errorf("Coexist bootloader isolation is not implemented for family %q; installation stopped before formatting", family)
	}
	return nil
}

func validatePlan(plan *Plan, checks partitionChecks) error {
	switch plan.Mode {
	case "erase":
		return nil
	case "replace":
		return validateRootSelection(plan.TargetPartition, checks)
	case "coexist":
	default:
		return fmt.Errorf("unknown installation mode %q", plan.Mode)
	}
	if checks.sharedHome == nil {
		return fmt.Errorf("shared HOME inventory unavailable")
	}
	sharedHome, err := checks.sharedHome()
	if err != nil {
		return err
	}
	if err := validateRootSelection(plan.TargetPartition, checks); err != nil {
		return err
	}
	if !checks.uefi() {
		return fmt.Errorf("Coexist requires a live system booted in UEFI mode")
	}
	if err := ValidateCoexistFamily(checks.family()); err != nil {
		return err
	}
	if plan.TargetPartition == "" {
		return fmt.Errorf("Coexist requires an explicitly selected root partition")
	}
	if plan.EspPartition == "" {
		return fmt.Errorf("Coexist requires the fixed EFI System Partition on the selected disk")
	}
	if plan.Device == "" || checks.disk == nil {
		return fmt.Errorf("Coexist selected disk inspection unavailable")
	}
	root, err := checks.partition(plan.TargetPartition)
	if err != nil {
		return fmt.Errorf("Coexist root: %w", err)
	}
	esp, err := checks.partition(plan.EspPartition)
	if err != nil {
		return fmt.Errorf("Coexist ESP: %w", err)
	}
	if root == esp {
		return fmt.Errorf("Coexist root and ESP must be different partitions")
	}
	if err := checks.disk(plan.Device, root, esp); err != nil {
		return fmt.Errorf("Coexist selected disk: %w", err)
	}
	valid, err := checks.esp(esp)
	if err != nil {
		return fmt.Errorf("Coexist ESP check: %w", err)
	}
	if !valid {
		return fmt.Errorf("Coexist requires an existing FAT EFI System Partition")
	}
	if err := ValidateEFIBootloaderID(plan.EFIBootloaderID); err != nil {
		return err
	}
	if used, err := checks.inUse(esp); err != nil || used {
		return fmt.Errorf("Coexist ESP must be unmounted and readable (in use: %t, probe error: %v)", used, err)
	}
	if err := checks.inspectEFI(esp, plan.EFIBootloaderID); err != nil {
		return fmt.Errorf("Coexist EFI inspection: %w", err)
	}
	inUse, err := checks.inUse(root)
	if err != nil {
		return fmt.Errorf("Coexist root safety check: %w", err)
	}
	if inUse {
		return fmt.Errorf("Coexist root %s is in use", root)
	}
	if plan.Swap != "" && plan.Swap != "none" && plan.Swap != "file" {
		return fmt.Errorf("Coexist supports only no swap or a root-local swap file")
	}
	if err := ValidateHomeNamespace(plan.HomeNamespace); err != nil {
		return err
	}
	if plan.HomeNamespace != plan.EFIBootloaderID {
		return fmt.Errorf("Coexist HOME namespace and EFI identity must match")
	}
	if plan.PreviousID != "" {
		if err := ValidateHomeNamespace(plan.PreviousID); err != nil {
			return err
		}
		if err := ValidateEFIBootloaderID(plan.PreviousID); err != nil {
			return err
		}
	}
	espInfo, err := checks.filesystem(esp)
	if err != nil || espInfo.UUID == "" {
		return fmt.Errorf("Coexist ESP UUID unavailable: %v", err)
	}
	if plan.PreviousID != "" && plan.PreviousID != plan.EFIBootloaderID {
		if err := checks.inspectEFI(esp, plan.PreviousID); err != nil {
			return fmt.Errorf("Coexist previous EFI inspection: %w", err)
		}
	}
	if plan.HomePartition != "" {
		home, err := checks.partition(plan.HomePartition)
		if err != nil {
			return fmt.Errorf("Coexist HOME: %w", err)
		}
		if home != sharedHome || home == root || home == esp {
			return fmt.Errorf("Coexist HOME must be the unique %s partition, separate from ROOT and ESP", SharedHomeLabel)
		}
		if used, err := checks.inUse(home); err != nil || used {
			return fmt.Errorf("Coexist HOME must be unmounted and readable (in use: %t, probe error: %v)", used, err)
		}
		info, err := checks.filesystem(home)
		if err != nil {
			return fmt.Errorf("Coexist HOME filesystem: %w", err)
		}
		if err := ValidateSharedHomeFilesystem(info.Type, info.Label); err != nil {
			return err
		}
		if info.UUID == "" {
			return fmt.Errorf("Coexist shared HOME requires a readable UUID")
		}
		if checks.inspectHome == nil {
			return fmt.Errorf("Coexist HOME inspection unavailable")
		}
		if err := checks.inspectHome(home, plan.HomeNamespace); err != nil {
			return fmt.Errorf("Coexist HOME inspection: %w", err)
		}
		if plan.PreviousID != "" && plan.PreviousID != plan.HomeNamespace {
			if err := checks.inspectHome(home, plan.PreviousID); err != nil {
				return fmt.Errorf("Coexist previous HOME inspection: %w", err)
			}
		}
		plan.HomePartition = home
	}
	// Use the verified canonical devices throughout the remaining modules.
	plan.TargetPartition, plan.EspPartition = root, esp
	if checks.identities == nil {
		return fmt.Errorf("Coexist identity inspection unavailable")
	}
	return checks.identities(plan)
}

func validateRootSelection(device string, checks partitionChecks) error {
	if device == "" || checks.rootTarget == nil || checks.inUse == nil {
		return fmt.Errorf("root partition selection or inspection unavailable")
	}
	if err := checks.rootTarget(device); err != nil {
		return err
	}
	if used, err := checks.inUse(device); err != nil || used {
		return fmt.Errorf("root partition %s is in use or unreadable (in use: %t, probe error: %v)", device, used, err)
	}
	return nil
}
