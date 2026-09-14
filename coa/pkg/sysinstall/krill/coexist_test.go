package krill

import (
	"encoding/json"
	"reflect"
	"slices"
	"strings"
	"testing"

	"coa/pkg/sysinstall/krill/engine"
	"github.com/charmbracelet/bubbles/textinput"
)

func TestCoexistESPDiscoveryMatchesPreflight(t *testing.T) {
	var devices lsblkRoot
	err := json.Unmarshal([]byte(`{"blockdevices":[{"path":"/dev/sda1","name":"sda1","type":"part","fstype":"vfat","parttype":"c12a7328-f81f-11d2-ba4b-00a0c93ec93b"}]}`), &devices)
	if err != nil {
		t.Fatal(err)
	}
	parts := collectPartitions(devices.BlockDevices)
	if len(parts) != 1 || !parts[0].IsEfi {
		t.Fatal("TUI failed to recognize observed ESP")
	}
	if got := coexistEfiPartitions(parts); len(got) != 1 || got[0].Path != "/dev/sda1" {
		t.Fatal("Coexist rejected observed ESP")
	}
	parts[0].FsType = "ext4"
	if len(coexistEfiPartitions(parts)) != 0 {
		t.Fatal("Coexist accepted non-FAT ESP")
	}
	parts[0].FsType = "vfat"
	parts[0].PartType = "0xef"
	if len(coexistEfiPartitions(parts)) != 0 {
		t.Fatal("Coexist accepted non-GPT ESP")
	}
}

func TestCoexistDiskSelections(t *testing.T) {
	m := model{
		diskModeIdx: 2, coexistStage: coexistInstall, diskModes: []string{"Erase disk", "Replace a partition", "Coexist with existing installations"},
		disks:          []DiskInfo{{Path: "/dev/test"}},
		candidateParts: []PartitionInfo{{Path: "/dev/test5"}},
		efiParts:       []PartitionInfo{{Path: "/dev/test1"}},
		homeParts:      []PartitionInfo{{Path: "/dev/test2", FsType: "ext4", Label: engine.SharedHomeLabel}},
		homeIdx:        -1,
		partIdx:        -1, efiIdx: 0, fsTypes: []string{"ext4"},
	}
	wantFields := []diskFieldKind{diskFieldDevice, diskFieldTargetPart, diskFieldFs, diskFieldNamespace, diskFieldSwap, diskFieldHome}
	if !reflect.DeepEqual(m.activeDiskFields(), wantFields) {
		t.Fatal("Coexist must not offer an ESP selector")
	}
	if !reflect.DeepEqual(m.availableSwapTypes(), []string{"none", "file"}) {
		t.Fatal("partition swap offered")
	}
	if view := m.viewDisk(); !strings.Contains(view, "SELECT ROOT") || !strings.Contains(view, "/dev/test1 [fixed, preserved]") {
		t.Fatal("missing ROOT prompt or fixed ESP")
	}
	m.diskField = slices.Index(m.activeDiskFields(), diskFieldTargetPart)
	next, _ := m.updateDisk("right")
	m = next.(model)
	if m.partIdx != 0 || m.efiIdx != 0 {
		t.Fatal("root selection changed fixed ESP")
	}
	if m.homeIdx != -1 {
		t.Fatal("HOME was selected implicitly")
	}
	m.diskField = slices.Index(m.activeDiskFields(), diskFieldHome)
	next, _ = m.updateDisk("right")
	m = next.(model)
	if m.homeIdx != 0 {
		t.Fatal("HOME selection failed")
	}
	m.diskField = slices.Index(m.activeDiskFields(), diskFieldNamespace)
	for _, key := range []string{"d", "e", "b", "i", "a", "n", "-", "s", "i", "d", "x", "backspace"} {
		next, _ = m.updateDisk(key)
		m = next.(model)
	}
	if m.homeNamespace != "debian-sid" {
		t.Fatalf("namespace: %q", m.homeNamespace)
	}
	view := m.coexistResources()
	for _, text := range []string{"FORMAT:", "Root: /dev/test5", "PRESERVE (no formatting):", "ESP: /dev/test1", "Shared HOME: /dev/test2", "Installation ID: debian-sid", "HOME namespace: /srv/homes/debian-sid", "New label: debian-sid"} {
		if !strings.Contains(view, text) {
			t.Fatalf("missing %q in resources", text)
		}
	}
}

func TestCoexistTargetSelectorShowsFilesystemLabel(t *testing.T) {
	m := model{
		diskModeIdx:    2,
		coexistStage:   coexistInstall,
		diskModes:      []string{"Erase disk", "Replace a partition", "Coexist with existing installations"},
		disks:          []DiskInfo{{Path: "/dev/test"}},
		candidateParts: []PartitionInfo{{Path: "/dev/sda5", Size: "8G", FsType: "ext4", Label: "arch-colibri-4"}},
		efiParts:       []PartitionInfo{{Path: "/dev/test1"}},
		partIdx:        0,
		fsTypes:        []string{"ext4"},
		swapTypes:      []string{"none", "file"},
	}

	view := m.viewDisk()
	for _, text := range []string{"/dev/sda5", "8G", "ext4", "arch-colibri-4"} {
		if !strings.Contains(view, text) {
			t.Fatalf("target selector missing %q: %s", text, view)
		}
	}
	m.homeNamespace = "arch-colibri-4"
	resources := m.coexistResources()
	for _, text := range []string{"COEXIST", "Installation ID: arch-colibri-4", "DELETE CONTENTS if present / CREATE if absent:", "EFI/arch-colibri-4", "Root: /dev/sda5 [arch-colibri-4]"} {
		if !strings.Contains(resources, text) {
			t.Fatalf("summary missing %q: %s", text, resources)
		}
	}

	// When replacing with a different namespace, purge notice must be shown and PreviousID populated
	m.homeNamespace = "debian"
	m.cfg = &InstallerConfig{}
	m.userInputs = make([]textinput.Model, 5)
	m.locData = TimezoneData{Regions: []string{"Europe"}, Zones: map[string][]string{"Europe": {"Rome"}}}
	resources = m.coexistResources()
	for _, text := range []string{"PURGE PREVIOUS (arch-colibri-4):", "EFI/arch-colibri-4"} {
		if !strings.Contains(resources, text) {
			t.Fatalf("summary missing purge notice %q: %s", text, resources)
		}
	}
	plan := m.buildPlan()
	if plan.PreviousID != "arch-colibri-4" {
		t.Fatalf("buildPlan() PreviousID = %q, want arch-colibri-4", plan.PreviousID)
	}

	// Generic slot labels like root2 should not trigger previous purge
	m.candidateParts[0].Label = "root2"
	resources = m.coexistResources()
	if strings.Contains(resources, "PURGE PREVIOUS") {
		t.Fatalf("unexpected purge notice for generic slot label: %s", resources)
	}
	plan = m.buildPlan()
	if plan.PreviousID != "" {
		t.Fatalf("buildPlan() PreviousID = %q, want empty for generic label", plan.PreviousID)
	}
}

func TestCoexistDiscoveryStaysOnSelectedDiskExceptHome(t *testing.T) {
	const guid = "c12a7328-f81f-11d2-ba4b-00a0c93ec93b"
	parts := map[string][]PartitionInfo{
		"/dev/nvme0n1": {
			{Path: "/dev/nvme0n1p1", FsType: "vfat", PartType: guid, IsEfi: true},
			{Path: "/dev/nvme0n1p2", FsType: "ext4"},
		},
		"/dev/sdb": {
			{Path: "/dev/sdb1", FsType: "vfat", PartType: guid, IsEfi: true},
			{Path: "/dev/sdb2", FsType: "ext4", Label: engine.SharedHomeLabel},
		},
	}
	m := model{diskModeIdx: 2, coexistStage: coexistInstall, diskBios: "UEFI",
		disks: []DiskInfo{{Path: "/dev/nvme0n1"}, {Path: "/dev/sdb"}}}
	detect := func() ([]PartitionInfo, error) {
		var inventory []PartitionInfo
		for disk, entries := range parts {
			for _, p := range entries {
				p.Disk = disk
				inventory = append(inventory, p)
			}
		}
		return inventory, nil
	}
	m.refreshPartitionsWith(detect, "")
	if m.efiIdx != 0 || len(m.efiParts) != 1 || m.efiParts[0].Path != "/dev/nvme0n1p1" {
		t.Fatal("local ESP was not fixed automatically")
	}
	if len(m.candidateParts) != 1 || m.candidateParts[0].Path != "/dev/nvme0n1p2" {
		t.Fatal("ROOT candidates include another disk or ESP")
	}
	if !slices.ContainsFunc(m.homeParts, func(p PartitionInfo) bool { return p.Path == "/dev/sdb2" }) {
		t.Fatal("external HOME is unavailable")
	}
	m.partIdx, m.homeIdx = 0, 1
	m.diskIdx = 1
	m.refreshPartitionsWith(detect, "")
	if m.efiParts[m.efiIdx].Path != "/dev/sdb1" || m.partIdx != -1 || m.homeIdx != -1 {
		t.Fatal("changing disk retained old selections")
	}
	parts["/dev/sdb"] = parts["/dev/sdb"][1:]
	m.refreshPartitionsWith(detect, "")
	if m.efiIdx != -1 || !strings.Contains(m.coexistESPError(), "No valid ESP") {
		t.Fatal("missing local ESP did not block selection")
	}
	parts["/dev/sdb"] = append(parts["/dev/sdb"],
		PartitionInfo{Path: "/dev/sdb1", FsType: "vfat", PartType: guid, IsEfi: true},
		PartitionInfo{Path: "/dev/sdb3", FsType: "vfat", PartType: guid, IsEfi: true})
	m.refreshPartitionsWith(detect, "")
	if m.efiIdx != -1 || !strings.Contains(m.coexistESPError(), "Multiple valid ESPs") {
		t.Fatal("ambiguous local ESP was selected arbitrarily")
	}
}
