package engine

import (
	"encoding/json"
	"fmt"
	"strings"

	"coa/pkg/utils"
)

type identityDevice struct {
	Path  string `json:"path"`
	Type  string `json:"type"`
	Label string `json:"label"`
}

// Inspect every attached device: selecting a different disk must not allow an
// installation to purge the HOME or EFI identity of another occupied slot.
func inspectCoexistIdentities(plan *Plan) error {
	devices, err := readIdentityDevices()
	if err != nil {
		return err
	}
	return validateCoexistIdentities(plan, devices)
}

func readIdentityDevices() ([]identityDevice, error) {
	out, err := utils.ExecCapture("lsblk --json --list --output PATH,TYPE,LABEL")
	if err != nil {
		return nil, fmt.Errorf("Coexist identity inventory: %w", err)
	}
	var inventory struct {
		Devices []identityDevice `json:"blockdevices"`
	}
	if err := json.Unmarshal([]byte(out), &inventory); err != nil {
		return nil, fmt.Errorf("Coexist identity inventory: %w", err)
	}
	if len(inventory.Devices) == 0 {
		return nil, fmt.Errorf("storage inventory is empty")
	}
	for _, device := range inventory.Devices {
		if device.Path == "" || device.Type == "" {
			return nil, fmt.Errorf("incomplete storage inventory")
		}
	}
	return inventory.Devices, nil
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
			if device.Label != "" && !IsGenericRootLabel(device.Label) && ValidateHomeNamespace(device.Label) == nil {
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
