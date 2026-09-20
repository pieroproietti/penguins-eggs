package krill

import (
	"strings"
	"testing"

	"github.com/charmbracelet/bubbles/textinput"
)

func TestSelectDefaultEfiIndex(t *testing.T) {
	// Case 1: Single ESP -> index 0
	single := []PartitionInfo{
		{Path: "/dev/nvme0n1p1", Disk: "/dev/nvme0n1", Size: "100M", Label: "SYSTEM", IsEfi: true},
	}
	if idx := SelectDefaultEfiIndex(single, single); idx != 0 {
		t.Fatalf("expected index 0 for single ESP, got %d", idx)
	}

	// Case 2: Windows ESP (p1) + Windows (p2, NTFS) + Linux ESP (p3, label "EFI")
	allParts := []PartitionInfo{
		{Path: "/dev/nvme0n1p1", Disk: "/dev/nvme0n1", Size: "100M", Label: "SYSTEM", IsEfi: true},
		{Path: "/dev/nvme0n1p2", Disk: "/dev/nvme0n1", Size: "100G", FsType: "ntfs", Label: "Windows"},
		{Path: "/dev/nvme0n1p3", Disk: "/dev/nvme0n1", Size: "512M", Label: "EFI", IsEfi: true},
		{Path: "/dev/nvme0n1p4", Disk: "/dev/nvme0n1", Size: "50G", FsType: "ext4", Label: "root"},
	}
	efiParts := []PartitionInfo{allParts[0], allParts[2]}
	if idx := SelectDefaultEfiIndex(efiParts, allParts); idx != 1 {
		t.Fatalf("expected index 1 (Linux ESP) for multiple ESPs with label 'EFI', got %d", idx)
	}

	// Case 3: Multiple ESPs where the second has no label, but is after Windows NTFS partition
	allPartsNoLabel := []PartitionInfo{
		{Path: "/dev/nvme0n1p1", Disk: "/dev/nvme0n1", Size: "100M", Label: "", IsEfi: true},
		{Path: "/dev/nvme0n1p2", Disk: "/dev/nvme0n1", Size: "100G", FsType: "ntfs"},
		{Path: "/dev/nvme0n1p3", Disk: "/dev/nvme0n1", Size: "512M", Label: "", IsEfi: true},
	}
	efiPartsNoLabel := []PartitionInfo{allPartsNoLabel[0], allPartsNoLabel[2]}
	if idx := SelectDefaultEfiIndex(efiPartsNoLabel, allPartsNoLabel); idx != 1 {
		t.Fatalf("expected index 1 for ESP located after Windows partition, got %d", idx)
	}

	// Case 4: Multiple ESPs on different disks, second has label LINUX_EFI
	multiDisk := []PartitionInfo{
		{Path: "/dev/nvme0n1p1", Disk: "/dev/nvme0n1", Size: "100M", Label: "SYSTEM", IsEfi: true},
		{Path: "/dev/sda1", Disk: "/dev/sda", Size: "512M", Label: "LINUX_EFI", IsEfi: true},
	}
	if idx := SelectDefaultEfiIndex(multiDisk, multiDisk); idx != 1 {
		t.Fatalf("expected index 1 for second ESP with label LINUX_EFI, got %d", idx)
	}
}

func TestEfiDisplayString(t *testing.T) {
	p := PartitionInfo{
		Path:       "/dev/nvme0n1p3",
		Size:       "512.0M",
		Label:      "EFI",
		MountPoint: "/boot/efi",
	}
	str := p.EfiDisplayString()
	if !strings.Contains(str, "/dev/nvme0n1p3") || !strings.Contains(str, "512.0M") || !strings.Contains(str, `"EFI"`) || !strings.Contains(str, "mounted on /boot/efi") {
		t.Fatalf("unexpected EfiDisplayString: %s", str)
	}
}

func TestCandidatePartitionsExcludeWindows(t *testing.T) {
	parts := []PartitionInfo{
		{Path: "/dev/nvme0n1p1", SizeBytes: 100 * 1024 * 1024, IsEfi: true, FsType: "vfat"},
		{Path: "/dev/nvme0n1p2", SizeBytes: 16 * 1024 * 1024, PartType: "e3c9e310-0b45-43e6-a825-4d0fe732e14a"}, // MSR
		{Path: "/dev/nvme0n1p3", SizeBytes: 100 * 1024 * 1024 * 1024, FsType: "ntfs", Label: "Windows"},          // Windows C:
		{Path: "/dev/nvme0n1p4", SizeBytes: 100 * 1024 * 1024 * 1024, FsType: "bitlocker"},                       // BitLocker
		{Path: "/dev/nvme0n1p5", SizeBytes: 1000 * 1024 * 1024, PartType: "de94bba4-06d1-4d40-a16a-bfd50179d6ac"}, // Recovery
		{Path: "/dev/nvme0n1p6", SizeBytes: 50 * 1024 * 1024 * 1024, FsType: "ext4", Label: "linux-root"},        // Candidate!
	}

	candidates := GetCandidatePartitions(parts, "")
	if len(candidates) != 1 || candidates[0].Path != "/dev/nvme0n1p6" {
		t.Fatalf("expected only /dev/nvme0n1p6 as candidate, got: %+v", candidates)
	}
}

func TestCandidateHomePartitions(t *testing.T) {
	allParts := []PartitionInfo{
		{Path: "/dev/nvme0n1p1", Disk: "/dev/nvme0n1", Size: "512M", IsEfi: true, FsType: "vfat"},
		{Path: "/dev/nvme0n1p2", Disk: "/dev/nvme0n1", Size: "50G", FsType: "ext4", Label: "root"},
		{Path: "/dev/nvme0n1p3", Disk: "/dev/nvme0n1", Size: "200G", FsType: "ext4", Label: "home"},
		{Path: "/dev/nvme0n1p4", Disk: "/dev/nvme0n1", Size: "100G", FsType: "ntfs", Label: "Windows"},
		{Path: "/dev/nvme0n1p5", Disk: "/dev/nvme0n1", Size: "8G", FsType: "swap"},
	}

	rootPath := "/dev/nvme0n1p2"
	espPath := "/dev/nvme0n1p1"

	homes := GetCandidateHomePartitions(allParts, rootPath, espPath, "")
	if len(homes) != 1 || homes[0].Path != "/dev/nvme0n1p3" {
		t.Fatalf("expected only /dev/nvme0n1p3 as candidate home, got: %+v", homes)
	}

	defIdx := SelectDefaultHomeIndex(homes)
	if defIdx != 0 || homes[defIdx].Label != "home" {
		t.Fatalf("expected home partition with label 'home' selected, got index %d", defIdx)
	}
}

func TestReplaceSummaryScreenDisplay(t *testing.T) {
	m := model{
		state:       StateSummary,
		diskModeIdx: 1,
		diskModes:   []string{"Erase disk", "Replace a partition"},
		productName: "penguins-eggs",
		disks:       []DiskInfo{{Path: "/dev/nvme0n1", Size: "500G"}},
		candidateParts: []PartitionInfo{
			{Path: "/dev/nvme0n1p4", Size: "50.0G", FsType: "ext4"},
		},
		partIdx: 0,
		efiParts: []PartitionInfo{
			{Path: "/dev/nvme0n1p1", Size: "100.0M", Label: "SYSTEM", IsEfi: true},
			{Path: "/dev/nvme0n1p3", Size: "512.0M", Label: "EFI", IsEfi: true},
		},
		efiIdx:  1, // Select second ESP
		fsTypes: []string{"ext4"},
		fsIdx:   0,
		candidateHomeParts: []PartitionInfo{
			{Path: "/dev/nvme0n1p5", Size: "200.0G", FsType: "ext4", Label: "home"},
		},
		homeUse:     true,
		homePartIdx: 0,
		userInputs:  make([]textinput.Model, 5),
		locData:     TimezoneData{Regions: []string{"Europe"}, Zones: map[string][]string{"Europe": {"Rome"}}},
	}

	summary := m.viewSummary()
	if !strings.Contains(summary, "RIEPILOGO INSTALLAZIONE PRE-PARTIZIONATA") {
		t.Fatalf("summary missing pre-partitioned layout title:\n%s", summary)
	}
	if !strings.Contains(summary, "/dev/nvme0n1p3") || !strings.Contains(summary, "USO - Nessuna modifica a /dev/nvme0n1p1") {
		t.Fatalf("summary missing ESP usage and protection note:\n%s", summary)
	}
	if !strings.Contains(summary, "/dev/nvme0n1p4") || !strings.Contains(summary, "FORMATTAZIONE ext4") {
		t.Fatalf("summary missing root formatting note:\n%s", summary)
	}
	if !strings.Contains(summary, "/dev/nvme0n1p5") || !strings.Contains(summary, "PRESERVATA - NESSUNA FORMATTAZIONE") {
		t.Fatalf("summary missing home preservation note:\n%s", summary)
	}
	if !strings.Contains(summary, "Verrà formattata SOLO la partizione di Root (/dev/nvme0n1p4)") {
		t.Fatalf("summary missing warning about root-only formatting:\n%s", summary)
	}
}
