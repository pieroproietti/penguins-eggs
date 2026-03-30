// Package init provides real disk partitioning, filesystem formatting,
// and BTRFS subvolume layout setup for `ilf init`.
//
// Each backend has a different partition layout requirement; this package
// implements the layout for each and delegates to the HAL Backend.Init()
// once the disk is prepared.
package init

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// DiskLayout describes the partition scheme to create on a target disk.
type DiskLayout struct {
	// Disk is the block device path (e.g. /dev/sda, /dev/nvme0n1).
	Disk string

	// Backend selects the partition scheme.
	Backend string

	// EFI is true when the system uses UEFI boot (creates an EFI partition).
	EFI bool

	// Encrypt is true when the root partition should be LUKS-encrypted.
	Encrypt bool

	// LUKSPassword is the passphrase for LUKS encryption (empty = prompt).
	LUKSPassword string

	// ExtraSubvols lists additional BTRFS subvolumes to create beyond the
	// backend's defaults (e.g. ["@snapshots", "@opt"]).
	ExtraSubvols []string
}

// Partition represents a single partition to create.
type Partition struct {
	Number  int
	Label   string
	FSType  string // vfat | btrfs | ext4 | swap
	SizeMiB int    // 0 = use remaining space
	Mount   string // where to mount after formatting
}

// LayoutForBackend returns the partition scheme for the given backend.
func LayoutForBackend(backend string, efi bool) ([]Partition, error) {
	var parts []Partition

	if efi {
		parts = append(parts, Partition{
			Number:  1,
			Label:   "ilf-efi",
			FSType:  "vfat",
			SizeMiB: 512,
			Mount:   "/boot/efi",
		})
	} else {
		parts = append(parts, Partition{
			Number:  1,
			Label:   "ilf-bios-boot",
			FSType:  "biosboot",
			SizeMiB: 1,
		})
	}

	switch backend {
	case "abroot":
		// ABRoot requires two equal root partitions (A and B) plus /var.
		parts = append(parts,
			Partition{Number: 2, Label: "vos-boot", FSType: "vfat", SizeMiB: 512, Mount: "/boot"},
			Partition{Number: 3, Label: "vos-a", FSType: "ext4", SizeMiB: 8192, Mount: "/"},
			Partition{Number: 4, Label: "vos-b", FSType: "ext4", SizeMiB: 8192},
			Partition{Number: 5, Label: "vos-var", FSType: "ext4", SizeMiB: 0, Mount: "/var"},
		)

	case "ashos", "frzr", "akshara", "btrfs-dwarfs":
		// All BTRFS-based backends share the same single-partition layout;
		// subvolumes provide the logical separation.
		parts = append(parts,
			Partition{Number: 2, Label: "ilf-boot", FSType: "vfat", SizeMiB: 512, Mount: "/boot"},
			Partition{Number: 3, Label: "ilf-root", FSType: "btrfs", SizeMiB: 0, Mount: "/"},
		)

	case "nixos":
		// NixOS uses a single root partition; /nix/store lives on it.
		parts = append(parts,
			Partition{Number: 2, Label: "nixos-boot", FSType: "vfat", SizeMiB: 512, Mount: "/boot"},
			Partition{Number: 3, Label: "nixos-root", FSType: "ext4", SizeMiB: 0, Mount: "/"},
		)

	default:
		return nil, fmt.Errorf("init: unknown backend %q", backend)
	}

	return parts, nil
}

// Run partitions disk, formats filesystems, mounts them under mountRoot,
// and creates the BTRFS subvolume layout for the chosen backend.
func Run(layout DiskLayout, mountRoot string) error {
	if err := checkPrereqs(layout.Backend); err != nil {
		return err
	}

	parts, err := LayoutForBackend(layout.Backend, layout.EFI)
	if err != nil {
		return err
	}

	fmt.Printf("init: partitioning %s for backend %q\n", layout.Disk, layout.Backend)

	if err := partition(layout.Disk, layout.EFI, parts); err != nil {
		return fmt.Errorf("init: partition: %w", err)
	}

	if err := formatAll(layout.Disk, parts); err != nil {
		return fmt.Errorf("init: format: %w", err)
	}

	if err := mountAll(layout.Disk, parts, mountRoot); err != nil {
		return fmt.Errorf("init: mount: %w", err)
	}

	if isBTRFSBackend(layout.Backend) {
		if err := createSubvolumes(layout.Backend, mountRoot, layout.ExtraSubvols); err != nil {
			return fmt.Errorf("init: subvolumes: %w", err)
		}
	}

	fmt.Printf("init: disk prepared at %s\n", mountRoot)
	return nil
}

// ── Partitioning ──────────────────────────────────────────────────────────────

func partition(disk string, _ bool, parts []Partition) error {
	// Wipe existing partition table.
	if err := run("sgdisk", "--zap-all", disk); err != nil {
		return err
	}

	for _, p := range parts {
		sizeArg := fmt.Sprintf("0:+%dM", p.SizeMiB)
		if p.SizeMiB == 0 {
			sizeArg = "0:0" // use remaining space
		}

		typeCode := partTypeCode(p.FSType)
		args := []string{
			fmt.Sprintf("--new=%d:%s", p.Number, sizeArg),
			fmt.Sprintf("--typecode=%d:%s", p.Number, typeCode),
			fmt.Sprintf("--change-name=%d:%s", p.Number, p.Label),
			disk,
		}
		if err := run("sgdisk", args...); err != nil {
			return fmt.Errorf("partition %d (%s): %w", p.Number, p.Label, err)
		}
	}

	// Inform the kernel of the new partition table.
	_ = run("partprobe", disk)
	return nil
}

func partTypeCode(fsType string) string {
	switch fsType {
	case "vfat":
		return "EF00" // EFI System
	case "biosboot":
		return "EF02" // BIOS boot
	case "swap":
		return "8200"
	default:
		return "8300" // Linux filesystem
	}
}

// ── Formatting ────────────────────────────────────────────────────────────────

func formatAll(disk string, parts []Partition) error {
	for _, p := range parts {
		dev := partDev(disk, p.Number)
		if err := formatPartition(dev, p); err != nil {
			return err
		}
	}
	return nil
}

func formatPartition(dev string, p Partition) error {
	switch p.FSType {
	case "vfat":
		return run("mkfs.fat", "-F32", "-n", strings.ToUpper(p.Label), dev)
	case "btrfs":
		return run("mkfs.btrfs", "-L", p.Label, "-f", dev)
	case "ext4":
		return run("mkfs.ext4", "-L", p.Label, "-F", dev)
	case "swap":
		return run("mkswap", "-L", p.Label, dev)
	case "biosboot":
		return nil // no filesystem needed
	default:
		return fmt.Errorf("format: unknown fstype %q for %s", p.FSType, dev)
	}
}

// ── Mounting ──────────────────────────────────────────────────────────────────

func mountAll(disk string, parts []Partition, mountRoot string) error {
	// Mount root first, then others in order.
	for _, p := range parts {
		if p.Mount == "" || p.Mount == "/" {
			continue
		}
	}
	for _, p := range parts {
		if p.Mount == "" {
			continue
		}
		dev := partDev(disk, p.Number)
		mnt := filepath.Join(mountRoot, p.Mount)
		if err := os.MkdirAll(mnt, 0o755); err != nil {
			return err
		}
		if p.FSType == "btrfs" {
			// Mount with compress=zstd for BTRFS partitions.
			if err := run("mount", "-o", "compress=zstd", dev, mnt); err != nil {
				return fmt.Errorf("mount %s -> %s: %w", dev, mnt, err)
			}
		} else {
			if err := run("mount", dev, mnt); err != nil {
				return fmt.Errorf("mount %s -> %s: %w", dev, mnt, err)
			}
		}
	}
	return nil
}

// ── BTRFS subvolume layout ────────────────────────────────────────────────────

// defaultSubvols returns the subvolume layout for each BTRFS-based backend.
func defaultSubvols(backend string) []string {
	switch backend {
	case "ashos":
		return []string{"@", "@home", "@var", "@log", "@pkg", "@.snapshots"}
	case "frzr":
		return []string{"root", "home", "var"}
	case "akshara":
		return []string{"@", "@home", "@var"}
	case "btrfs-dwarfs":
		return []string{"@upper", "@home", "@var"}
	default:
		return []string{"@", "@home", "@var"}
	}
}

func createSubvolumes(backend, mountRoot string, extra []string) error {
	subvols := append(defaultSubvols(backend), extra...)
	for _, sv := range subvols {
		path := filepath.Join(mountRoot, sv)
		if err := run("btrfs", "subvolume", "create", path); err != nil {
			return fmt.Errorf("create subvolume %s: %w", sv, err)
		}
		fmt.Printf("init: created subvolume %s\n", sv)
	}
	return nil
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func isBTRFSBackend(backend string) bool {
	switch backend {
	case "ashos", "frzr", "akshara", "btrfs-dwarfs":
		return true
	}
	return false
}

// PartDev returns the partition device path for a given disk and partition number.
// Handles both /dev/sdX (e.g. /dev/sda1) and /dev/nvmeXnY (e.g. /dev/nvme0n1p1).
// Exported for use in tests and external tooling.
func PartDev(disk string, num int) string {
	if strings.Contains(disk, "nvme") || strings.Contains(disk, "mmcblk") {
		return fmt.Sprintf("%sp%d", disk, num)
	}
	return fmt.Sprintf("%s%d", disk, num)
}

// partDev is the internal alias used within this package.
func partDev(disk string, num int) string { return PartDev(disk, num) }

func checkPrereqs(backend string) error {
	required := []string{"sgdisk", "partprobe", "mkfs.fat"}
	if isBTRFSBackend(backend) {
		required = append(required, "mkfs.btrfs", "btrfs")
	} else {
		required = append(required, "mkfs.ext4")
	}
	for _, cmd := range required {
		if _, err := exec.LookPath(cmd); err != nil {
			return fmt.Errorf("init: required tool %q not found (install gdisk, btrfs-progs, dosfstools)", cmd)
		}
	}
	return nil
}

func run(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("%s %s: %s: %w", name, strings.Join(args, " "),
			strings.TrimSpace(string(out)), err)
	}
	return nil
}
