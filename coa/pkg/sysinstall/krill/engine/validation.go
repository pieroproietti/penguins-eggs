package engine

import (
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
	uefi        func() bool
	partition   func(string) (string, error)
	esp         func(string) (bool, error)
	inUse       func(string) (bool, error)
	filesystem  func(string) (filesystemInfo, error)
	inspectHome func(string, string) error
	family      func() string
	inspectEFI  func(string, string) error
	identities  func(*Plan) error
}

func (c *ctx) safetyChecks() partitionChecks {
	if c.checks != nil {
		return *c.checks
	}
	return livePartitionChecks()
}

func livePartitionChecks() partitionChecks {
	return partitionChecks{
		uefi:        IsUEFI,
		partition:   canonicalPartition,
		esp:         isESP,
		inUse:       deviceInUse,
		filesystem:  probeFilesystem,
		inspectHome: inspectHomePartition,
		family:      func() string { return distro.NewDistro().FamilyID },
		inspectEFI:  inspectEFIPartition,
		identities:  inspectCoexistIdentities,
	}
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
	if family != "debian" && family != "archlinux" {
		return fmt.Errorf("Coexist bootloader isolation is not implemented for family %q; installation stopped before formatting", family)
	}
	return nil
}

func validatePlan(plan *Plan, checks partitionChecks) error {
	switch plan.Mode {
	case "erase", "replace":
		return nil
	case "coexist":
	default:
		return fmt.Errorf("unknown installation mode %q", plan.Mode)
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
		return fmt.Errorf("Coexist requires an explicitly selected EFI System Partition")
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
	if plan.HomePartition == "" {
		return fmt.Errorf("Coexist requires an explicitly selected shared HOME partition")
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
	home, err := checks.partition(plan.HomePartition)
	if err != nil {
		return fmt.Errorf("Coexist HOME: %w", err)
	}
	if home == root || home == esp {
		return fmt.Errorf("Coexist root, ESP and HOME must be different partitions")
	}
	if used, err := checks.inUse(home); err != nil || used {
		return fmt.Errorf("Coexist HOME must be unmounted and readable (in use: %t, probe error: %v)", used, err)
	}
	info, err := checks.filesystem(home)
	if err != nil {
		return fmt.Errorf("Coexist HOME filesystem: %w", err)
	}
	if info.Type != "ext4" || info.UUID == "" {
		return fmt.Errorf("Coexist shared HOME requires ext4 with a readable UUID")
	}
	espInfo, err := checks.filesystem(esp)
	if err != nil || espInfo.UUID == "" {
		return fmt.Errorf("Coexist ESP UUID unavailable: %v", err)
	}
	inspectHome := checks.inspectHome
	if inspectHome == nil {
		return fmt.Errorf("Coexist HOME inspection unavailable")
	}
	if err := inspectHome(home, plan.HomeNamespace); err != nil {
		return fmt.Errorf("Coexist HOME inspection: %w", err)
	}
	if plan.PreviousID != "" && plan.PreviousID != plan.HomeNamespace {
		if err := inspectHome(home, plan.PreviousID); err != nil {
			return fmt.Errorf("Coexist previous HOME inspection: %w", err)
		}
		if err := checks.inspectEFI(esp, plan.PreviousID); err != nil {
			return fmt.Errorf("Coexist previous EFI inspection: %w", err)
		}
	}
	plan.HomePartition = home
	// Use the verified canonical devices throughout the remaining modules.
	plan.TargetPartition, plan.EspPartition = root, esp
	if checks.identities == nil {
		return fmt.Errorf("Coexist identity inspection unavailable")
	}
	return checks.identities(plan)
}
