package engine

import (
	"encoding/json"
	"fmt"
	"slices"
	"strings"

	"coa/pkg/utils"
)

const SharedHomeLabel = "SHARED_HOMES"

// IsSharedHomeLabel matches SHARED_HOMES (and SHARED_HOME) case-insensitively across disks.
func IsSharedHomeLabel(label string) bool {
	clean := strings.TrimSpace(label)
	return strings.EqualFold(clean, SharedHomeLabel) || strings.EqualFold(clean, "SHARED_HOME")
}

// UniqueSharedHome counts labelled devices before checking their eligibility.
// Repeated observations of the same device in a block-device tree count once.
func UniqueSharedHome(paths []string) (string, error) {
	unique := slices.Clone(paths)
	slices.Sort(unique)
	unique = slices.Compact(unique)
	if len(unique) > 1 {
		return "", fmt.Errorf("multiple %s partitions: %s; keep this label on only one partition, then restart Krill", SharedHomeLabel, strings.Join(unique, ", "))
	}
	if len(unique) == 1 {
		return unique[0], nil
	}
	return "", nil
}

func DetectSharedHome() (string, error) {
	paths, err := DetectAllSharedHomePaths()
	if err != nil {
		return "", err
	}
	return UniqueSharedHome(paths)
}

func DetectAllSharedHomePaths() ([]string, error) {
	devices, err := readIdentityDevices()
	if err != nil {
		return nil, err
	}
	var paths []string
	for _, device := range devices {
		if device.Path == "" {
			continue
		}
		if (device.Type == "part" || device.Type == "disk" || device.Type == "ext4" || device.Type == "") &&
			(IsSharedHomeLabel(device.Label) || IsSharedHomeLabel(device.PartLabel)) {
			paths = append(paths, device.Path)
		}
	}
	unique := slices.Clone(paths)
	slices.Sort(unique)
	return slices.Compact(unique), nil
}

func ValidateSharedHomeFilesystem(fs, label string) error {
	if fs != "ext4" || !IsSharedHomeLabel(label) {
		return fmt.Errorf("shared HOME requires an ext4 partition labelled %s", SharedHomeLabel)
	}
	return nil
}

// RootPartitionAllowed is shared by discovery and the last check before wipefs.
func RootPartitionAllowed(label, fs, partType string, busy, readOnly bool) bool {
	return RootPartitionAllowedWithPartLabel(label, "", fs, partType, busy, readOnly)
}

func RootPartitionAllowedWithPartLabel(label, partLabel, fs, partType string, busy, readOnly bool) bool {
	return !IsSharedHomeLabel(label) && !IsSharedHomeLabel(partLabel) && fs != "swap" && !busy && !readOnly &&
		!strings.EqualFold(partType, espGUID) && !strings.EqualFold(partType, "0xef") && !strings.EqualFold(partType, "ef")
}

func inspectRootTarget(device string) error {
	out, err := utils.ExecCapture("lsblk --json --tree --output PATH,TYPE,LABEL,PARTLABEL,FSTYPE,PARTTYPE,RO,MOUNTPOINTS ")
	if err != nil {
		return fmt.Errorf("root partition inspection: %w", err)
	}
	return validateRootTarget(device, out)
}

// IsLiveMount recognizes the live media locations used by supported live stacks.
func IsLiveMount(mount string) bool {
	for _, prefix := range []string{"/run/live", "/lib/live/mount", "/run/archiso", "/run/miso", "/cdrom"} {
		if mount == prefix || strings.HasPrefix(mount, prefix+"/") {
			return true
		}
	}
	return false
}

type rootTargetDevice struct {
	Path, Type, Label, PartLabel string
	FsType                       string             `json:"fstype"`
	PartType                     string             `json:"parttype"`
	ReadOnly                     bool               `json:"ro"`
	Mounts                       []string           `json:"mountpoints"`
	Children                     []rootTargetDevice `json:"children"`
}

func (p rootTargetDevice) containsLiveMedia() bool {
	for _, mount := range p.Mounts {
		if IsLiveMount(mount) {
			return true
		}
	}
	for _, child := range p.Children {
		if child.containsLiveMedia() {
			return true
		}
	}
	return false
}

func validateRootTarget(device, output string) error {
	var tree struct {
		Devices []rootTargetDevice `json:"blockdevices"`
	}
	if err := json.Unmarshal([]byte(output), &tree); err != nil {
		return err
	}
	found := false
	var visit func(rootTargetDevice, bool, bool) error
	visit = func(p rootTargetDevice, live, readOnly bool) error {
		if p.Type == "disk" {
			live = live || p.containsLiveMedia()
		}
		readOnly = readOnly || p.ReadOnly
		if p.Path == device {
			found = true
			busy := live || len(p.Children) > 0
			for _, mount := range p.Mounts {
				busy = busy || mount != ""
			}
			if p.Type != "part" || !RootPartitionAllowedWithPartLabel(p.Label, p.PartLabel, p.FsType, p.PartType, busy, readOnly) {
				return fmt.Errorf("refusing root %s: %s, EFI, swap, live-media, read-only or occupied devices cannot be installation targets", device, SharedHomeLabel)
			}
		}
		for _, child := range p.Children {
			if err := visit(child, live, readOnly); err != nil {
				return err
			}
		}
		return nil
	}
	for _, p := range tree.Devices {
		if err := visit(p, false, false); err != nil {
			return err
		}
	}
	if !found {
		return fmt.Errorf("root partition missing from storage inventory: %s", device)
	}
	return nil
}
