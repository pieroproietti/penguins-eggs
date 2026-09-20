package engine

import (
	"encoding/json"
	"fmt"
	"strings"

	"coa/pkg/utils"
)

// IsWindowsPartition identifies NTFS, BitLocker, MSR, and Windows Recovery partitions.
func IsWindowsPartition(fs, partType, label, partLabel string) bool {
	fsLower := strings.ToLower(fs)
	if fsLower == "ntfs" || fsLower == "bitlocker" {
		return true
	}
	if strings.EqualFold(partType, "ebd0a0a2-b9e5-4433-87c0-68b6b72699c7") && (fsLower == "ntfs" || fsLower == "") {
		return true
	}
	if strings.EqualFold(partType, "e3c9e310-0b45-43e6-a825-4d0fe732e14a") { // MSR
		return true
	}
	if strings.EqualFold(partType, "de94bba4-06d1-4d40-a16a-bfd50179d6ac") { // Windows Recovery
		return true
	}
	lLower := strings.ToLower(label)
	plLower := strings.ToLower(partLabel)
	if strings.Contains(lLower, "recovery") || strings.Contains(plLower, "recovery") ||
		strings.Contains(lLower, "msr") || strings.Contains(plLower, "msr") ||
		strings.Contains(lLower, "microsoft reserved") || strings.Contains(plLower, "microsoft reserved") {
		return true
	}
	return false
}

// RootPartitionAllowed is shared by discovery and the last check before wipefs.
func RootPartitionAllowed(label, fs, partType string, busy, readOnly bool) bool {
	return RootPartitionAllowedWithPartLabel(label, "", fs, partType, busy, readOnly)
}

func RootPartitionAllowedWithPartLabel(label, partLabel, fs, partType string, busy, readOnly bool) bool {
	return fs != "swap" && !busy && !readOnly && !IsWindowsPartition(fs, partType, label, partLabel) &&
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
				return fmt.Errorf("refusing root %s: EFI, swap, live-media, read-only or occupied devices cannot be installation targets", device)
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

type filesystemInfo struct {
	Type  string
	UUID  string
	Label string
}

func shellQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", "'\"'\"'") + "'"
}

func probeFilesystem(device string) (filesystemInfo, error) {
	out, err := utils.ExecCapture("blkid -p -o export " + shellQuote(device))
	if err != nil {
		return filesystemInfo{}, err
	}
	var info filesystemInfo
	for _, line := range strings.Split(out, "\n") {
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		switch key {
		case "TYPE":
			info.Type = value
		case "UUID":
			info.UUID = value
		case "LABEL":
			info.Label = value
		}
	}
	if info.Type == "" || info.UUID == "" || strings.ContainsAny(info.UUID, " \t\n\\") {
		return info, fmt.Errorf("missing or invalid filesystem type/UUID on %s", device)
	}
	return info, nil
}
