package krill

import (
	"encoding/json"
	"reflect"
	"strings"
	"testing"
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
		diskModeIdx: 2, diskModes: []string{"Erase disk", "Replace a partition", "Coexist with existing installations"},
		disks:          []DiskInfo{{Path: "/dev/test"}},
		candidateParts: []PartitionInfo{{Path: "/dev/test5"}},
		efiParts:       []PartitionInfo{{Path: "/dev/test1"}},
		homeParts:      []PartitionInfo{{Path: "/dev/test2", FsType: "ext4"}},
		homeIdx:        -1,
		partIdx:        -1, efiIdx: -1, fsTypes: []string{"ext4"},
	}
	wantFields := []diskFieldKind{diskFieldMode, diskFieldDevice, diskFieldTargetPart, diskFieldEfi, diskFieldHome, diskFieldNamespace, diskFieldFs, diskFieldSwap, diskFieldInitialize}
	if !reflect.DeepEqual(m.activeDiskFields(), wantFields) {
		t.Fatal("Coexist must show an explicit ESP selector even with one ESP")
	}
	if !reflect.DeepEqual(m.availableSwapTypes(), []string{"none", "file"}) {
		t.Fatal("partition swap offered")
	}
	if view := m.viewDisk(); !strings.Contains(view, "SELECT ROOT") || !strings.Contains(view, "SELECT ESP") {
		t.Fatal("missing explicit-selection prompts")
	}
	m.diskField = 2
	next, _ := m.updateDisk("right")
	m = next.(model)
	if m.partIdx != 0 || m.efiIdx != -1 {
		t.Fatal("root selection also selected ESP")
	}
	m.diskField = 3
	next, _ = m.updateDisk("right")
	m = next.(model)
	if m.efiIdx != 0 {
		t.Fatal("ESP selection failed")
	}
	if m.homeIdx != -1 {
		t.Fatal("HOME was selected implicitly")
	}
	m.diskField = 4
	next, _ = m.updateDisk("right")
	m = next.(model)
	if m.homeIdx != 0 {
		t.Fatal("HOME selection failed")
	}
	m.diskField = 5
	for _, key := range []string{"d", "e", "b", "i", "a", "n", "-", "s", "i", "d", "x", "backspace"} {
		next, _ = m.updateDisk(key)
		m = next.(model)
	}
	if m.homeNamespace != "debian-sid" {
		t.Fatalf("namespace: %q", m.homeNamespace)
	}
	view := m.coexistResources()
	for _, text := range []string{"FORMAT:", "Root: /dev/test5", "PRESERVE (no formatting):", "EFI:  /dev/test1", "Shared HOME: /dev/test2", "Namespace: debian-sid", "Target: /srv/homes/debian-sid"} {
		if !strings.Contains(view, text) {
			t.Fatalf("missing %q in resources", text)
		}
	}
}
