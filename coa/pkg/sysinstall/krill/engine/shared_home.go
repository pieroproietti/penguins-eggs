package engine

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"slices"
	"strings"

	"coa/pkg/utils"
)

// SharedHomePartition is preserved storage, outside the disk being prepared.
// UUID and size are included in the preview's identity recheck before writing.
type SharedHomePartition struct {
	Partition, UUID string
	SizeBytes       uint64
}

func InspectExternalHomePartition(partition, excludedDisk string) (SharedHomePartition, error) {
	l := SharedHomePartition{}
	var err error
	l.Partition, err = canonicalPartition(partition)
	if err != nil {
		return l, err
	}
	excludedDisk, err = filepath.EvalSymlinks(excludedDisk)
	if err != nil {
		return l, err
	}
	ancestors, err := utils.ExecCapture("lsblk --inverse --noheadings --raw --output PATH " + shellQuote(l.Partition))
	if err != nil {
		return l, err
	}
	if err := validateExternalHomeDisk(ancestors, l.Partition, excludedDisk); err != nil {
		return l, err
	}
	out, err := utils.ExecCapture("lsblk --bytes --json --tree --output PATH,TYPE,SIZE,RO,MOUNTPOINTS " + shellQuote(l.Partition))
	if err != nil {
		return l, err
	}
	var tree struct {
		Devices []initializationDisk `json:"blockdevices"`
	}
	if err := json.Unmarshal([]byte(out), &tree); err != nil {
		return l, err
	}
	if len(tree.Devices) != 1 || tree.Devices[0].Path != l.Partition || tree.Devices[0].Type != "part" {
		return l, fmt.Errorf("select a single existing external HOME partition")
	}
	if err := checkInitializationDisk(tree.Devices[0], ""); err != nil {
		return l, fmt.Errorf("external HOME must be unmounted and writable: %w", err)
	}
	fs, err := probeFilesystem(l.Partition)
	if err != nil {
		return l, err
	}
	if err := ValidateSharedHomeFilesystem(fs.Type, fs.Label); err != nil {
		return l, err
	}
	l.UUID, l.SizeBytes = fs.UUID, tree.Devices[0].Size
	return l, nil
}

func validateExternalHomeDisk(ancestors, partition, excludedDisk string) error {
	devices := strings.Fields(ancestors)
	if !slices.Contains(devices, partition) || len(devices) < 2 {
		return fmt.Errorf("cannot identify the external HOME disk")
	}
	if slices.Contains(devices, excludedDisk) {
		return fmt.Errorf("external HOME must be on another disk; %s is the Coexist disk", excludedDisk)
	}
	return nil
}
