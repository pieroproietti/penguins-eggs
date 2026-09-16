package engine

import (
	"errors"
	"strings"
	"testing"
)

func TestCoexistIdentityInventoryBeforeFormatting(t *testing.T) {
	for _, tc := range []struct {
		name, oldLabel, previous, otherLabel string
		missing, wantError                   bool
	}{
		{name: "empty slot", oldLabel: "root3"},
		{name: "unlabelled root"},
		{name: "same ID reinstall", oldLabel: "colibri-1", previous: "colibri-1"},
		{name: "rename slot", oldLabel: "arch", previous: "arch"},
		{name: "new ID on another disk", oldLabel: "root3", otherLabel: "colibri-1", wantError: true},
		{name: "case insensitive EFI collision", otherLabel: "COLIBRI-1", wantError: true},
		{name: "previous ID on another disk", oldLabel: "arch", previous: "arch", otherLabel: "arch", wantError: true},
		{name: "stale root selection", oldLabel: "fedora", previous: "arch", wantError: true},
		{name: "unreviewed cleanup", oldLabel: "arch", wantError: true},
		{name: "missing root", missing: true, wantError: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p := coexistPlan()
			p.PreviousID = tc.previous
			inventory := []identityDevice{{Path: "/dev/other9", Type: "part", Label: tc.otherLabel}}
			if !tc.missing {
				inventory = append(inventory, identityDevice{Path: p.TargetPartition, Type: "part", Label: tc.oldLabel})
			}
			c, commands := testContext(t, p)
			c.checks.identities = func(p *Plan) error { return validateCoexistIdentities(p, inventory) }
			err := runPartition(c)
			if (err != nil) != tc.wantError {
				t.Fatalf("unexpected validation: %v", err)
			}
			if tc.wantError && len(*commands) != 0 {
				t.Fatalf("commands before identity rejection: %v", *commands)
			}
		})
	}
}

func TestCoexistAdditionalPreflightGuards(t *testing.T) {
	for _, tc := range []struct {
		name   string
		change func(*Plan, *partitionChecks)
	}{
		{"openSUSE bootloader", func(_ *Plan, c *partitionChecks) { c.family = func() string { return "opensuse" } }},
		{"Alpine bootloader", func(_ *Plan, c *partitionChecks) { c.family = func() string { return "alpine" } }},
		{"unknown bootloader", func(_ *Plan, c *partitionChecks) { c.family = func() string { return "unknown" } }},
		{"mounted ESP", func(p *Plan, c *partitionChecks) {
			c.inUse = func(device string) (bool, error) { return device == p.EspPartition, nil }
		}},
		{"reserved previous EFI", func(p *Plan, _ *partitionChecks) { p.PreviousID = "boot" }},
		{"invalid previous ID", func(p *Plan, _ *partitionChecks) { p.PreviousID = "../other" }},
		{"generic installation ID", func(p *Plan, _ *partitionChecks) { p.EFIBootloaderID = "root3" }},
		{"inventory unavailable", func(_ *Plan, c *partitionChecks) { c.identities = nil }},
		{"inventory failure", func(_ *Plan, c *partitionChecks) {
			c.identities = func(*Plan) error { return errors.New("lsblk failed") }
		}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p := coexistPlan()
			c, commands := testContext(t, p)
			tc.change(p, c.checks)
			if err := runPartition(c); err == nil {
				t.Fatal("unsafe plan accepted")
			}
			if len(*commands) != 0 {
				t.Fatalf("commands before rejection: %v", *commands)
			}
		})
	}
}

func TestGenericIDsAreReserved(t *testing.T) {
	for _, id := range []string{"root", "root1", "root123"} {
		if err := ValidateInstallationID(id); err == nil || !strings.Contains(err.Error(), "reserved") {
			t.Fatalf("accepted ambiguous slot identity %q: %v", id, err)
		}
	}
}

func TestCoexistChecksPreviousDestinationsBeforeFormatting(t *testing.T) {
	p := coexistPlan()
	p.PreviousID = "arch"
	c, commands := testContext(t, p)
	c.checks.inspectEFI = func(_ string, id string) error {
		if id == p.PreviousID {
			return errors.New("unsafe previous destination")
		}
		return nil
	}
	err := runPartition(c)
	if err == nil || !strings.Contains(err.Error(), "previous EFI") || len(*commands) != 0 {
		t.Fatalf("unsafe previous cleanup accepted: %v, commands %v", err, *commands)
	}
}
