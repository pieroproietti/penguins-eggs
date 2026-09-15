package engine

import (
	"encoding/json"
	"fmt"
	"strings"

	"coa/pkg/utils"
)

type identityDevice struct {
	Path      string `json:"path"`
	Type      string `json:"type"`
	Label     string `json:"label"`
	PartLabel string `json:"partlabel"`
}

type BlkidEntry struct {
	Path      string
	Label     string
	PartLabel string
	Type      string
}

// ReadBlkidExport runs blkid -o export directly probing superblocks.
func ReadBlkidExport() string {
	for _, bin := range []string{"blkid", "/usr/sbin/blkid", "/sbin/blkid"} {
		out, err := utils.ExecCapture(bin + " -o export")
		if err == nil && len(strings.TrimSpace(out)) > 0 {
			return out
		}
	}
	return ""
}

// ParseBlkidExport extracts DEVNAME, LABEL, PARTLABEL, and TYPE from blkid -o export output.
func ParseBlkidExport(raw string) []BlkidEntry {
	var entries []BlkidEntry
	var curr BlkidEntry
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			if curr.Path != "" {
				entries = append(entries, curr)
				curr = BlkidEntry{}
			}
			continue
		}
		eq := strings.IndexByte(line, '=')
		if eq < 0 {
			continue
		}
		k, v := line[:eq], line[eq+1:]
		switch k {
		case "DEVNAME":
			if curr.Path != "" {
				entries = append(entries, curr)
				curr = BlkidEntry{}
			}
			curr.Path = v
		case "LABEL":
			curr.Label = v
		case "PARTLABEL":
			curr.PartLabel = v
		case "TYPE":
			curr.Type = v
		}
	}
	if curr.Path != "" {
		entries = append(entries, curr)
	}
	return entries
}

func enrichIdentityWithBlkid(devices []identityDevice) []identityDevice {
	raw := ReadBlkidExport()
	if raw == "" {
		return devices
	}
	entries := ParseBlkidExport(raw)
	byPath := make(map[string]BlkidEntry, len(entries))
	for _, e := range entries {
		byPath[e.Path] = e
	}
	seen := make(map[string]bool, len(devices))
	for i := range devices {
		p := devices[i].Path
		if p == "" {
			continue
		}
		seen[p] = true
		if b, ok := byPath[p]; ok {
			if devices[i].Label == "" && b.Label != "" {
				devices[i].Label = b.Label
			}
			if devices[i].PartLabel == "" && b.PartLabel != "" {
				devices[i].PartLabel = b.PartLabel
			}
			if devices[i].Type == "" && b.Type != "" {
				devices[i].Type = b.Type
			}
		}
	}
	return devices
}

// Inspect every attached device: selecting a different disk must not allow an
// installation to purge the EFI identity of another occupied slot.
func inspectCoexistIdentities(plan *Plan) error {
	devices, err := readIdentityDevices()
	if err != nil {
		return err
	}
	return validateCoexistIdentities(plan, devices)
}

func readIdentityDevices() ([]identityDevice, error) {
	out, err := utils.ExecCapture("lsblk --json --list --output PATH,TYPE,LABEL,PARTLABEL")
	if err != nil {
		return nil, fmt.Errorf("Coexist identity inventory: %w", err)
	}
	var inventory struct {
		Devices []identityDevice `json:"blockdevices"`
	}
	if err := json.Unmarshal([]byte(out), &inventory); err != nil {
		return nil, fmt.Errorf("Coexist identity inventory: %w", err)
	}
	inventory.Devices = enrichIdentityWithBlkid(inventory.Devices)
	var valid []identityDevice
	for _, device := range inventory.Devices {
		if device.Path != "" {
			valid = append(valid, device)
		}
	}
	if len(valid) == 0 {
		return nil, fmt.Errorf("storage inventory is empty")
	}
	return valid, nil
}

func validateCoexistIdentities(plan *Plan, devices []identityDevice) error {
	found := false
	for _, device := range devices {
		if device.Path == plan.TargetPartition {
			if device.Type != "part" {
				return fmt.Errorf("Coexist root is no longer a partition")
			}
			found = true
			previous := ""
			if device.Label != "" && !IsGenericRootLabel(device.Label) && ValidateInstallationID(device.Label) == nil {
				previous = device.Label
			}
			if previous != plan.PreviousID {
				return fmt.Errorf("Coexist root identity changed; select the root again and review the cleanup summary")
			}
			continue
		}
		for _, id := range []string{plan.EFIBootloaderID, plan.PreviousID} {
			if id != "" && strings.EqualFold(device.Label, id) {
				return fmt.Errorf("Coexist identity %q is already used by %s; choose another ID or its root slot", id, device.Path)
			}
		}
	}
	if !found {
		return fmt.Errorf("Coexist root missing from identity inventory")
	}
	return nil
}
