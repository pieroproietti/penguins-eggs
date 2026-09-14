package krill

import (
	"errors"
	"slices"
	"strings"
	"testing"

	"coa/pkg/sysinstall/krill/engine"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

func TestPreparationHomeChoice(t *testing.T) {
	for _, existing := range []bool{false, true} {
		m := model{state: StateDisk, diskModeIdx: 2, coexistStage: coexistHomeLocation,
			prepareRootHome: true, termWidth: 80, termHeight: 24, disks: []DiskInfo{{Path: "/dev/test"}}}
		if existing {
			m.homeParts = []PartitionInfo{{Path: "/dev/other1", FsType: "ext4", Label: engine.SharedHomeLabel}}
		}
		view := m.View()
		if !strings.Contains(view, "(•) On system partition") || lipgloss.Height(view) > 24 || lipgloss.Width(view) > 80 {
			t.Fatalf("invalid preparation screen: %s", view)
		}
		for _, key := range []string{"down", "enter"} {
			next, cmd := m.updateDisk(key)
			m = next.(model)
			if cmd != nil {
				t.Fatal("HOME choice dispatched disk operations")
			}
		}
		if m.coexistStage != coexistPrepare || m.prepareRootHome || m.homeExternal != existing {
			t.Fatalf("wrong preparation choice: %+v", m)
		}
		if existing && m.prepareHome.Path != "/dev/other1" {
			t.Fatal("unique HOME was not selected")
		}
		m.coexistStage = coexistHomeLocation
		for _, key := range []string{"up", "enter"} {
			next, _ := m.updateDisk(key)
			m = next.(model)
		}
		if !m.prepareRootHome || m.homeExternal || m.prepareHome.Path != "" {
			t.Fatal("ROOT HOME retained shared storage")
		}
	}
}

func TestHomeDiscoveryAndDefaults(t *testing.T) {
	for _, count := range []int{0, 1, 2} {
		m := identityModel()
		parts := []PartitionInfo{{Disk: "/dev/test", Path: "/dev/test1", FsType: "vfat", PartType: "c12a7328-f81f-11d2-ba4b-00a0c93ec93b", IsEfi: true},
			{Disk: "/dev/test", Path: "/dev/test3", FsType: "ext4"}}
		for i := 0; i < count; i++ {
			parts = append(parts, PartitionInfo{Disk: "/dev/test", Path: []string{"/dev/test2", "/dev/test4"}[i], Label: engine.SharedHomeLabel, FsType: "ext4"})
		}
		m.refreshPartitionsWith(func() ([]PartitionInfo, error) { return parts, nil }, "")
		if m.homeIdx != -1 || m.buildPlan().HomePartition != "" {
			t.Fatal("shared HOME selected implicitly")
		}
		if len(m.candidateParts) != 1 || m.candidateParts[0].Path != "/dev/test3" {
			t.Fatal("shared storage offered as ROOT")
		}
		if slices.Contains(m.activeDiskFields(), diskFieldHome) != (count == 1) {
			t.Fatal("HOME selector should require a unique partition")
		}
		if count == 0 && !strings.Contains(m.View(), "SHARED_HOMES and restart Krill") {
			t.Fatal("missing labelling instructions")
		}
		if count == 1 {
			m.diskField = slices.Index(m.activeDiskFields(), diskFieldHome)
			for _, want := range []int{0, -1} {
				next, _ := m.updateDisk("right")
				m = next.(model)
				if m.homeIdx != want {
					t.Fatal("HOME location did not toggle")
				}
			}
		}
		if count == 2 {
			m.homeParts[1].FsType, m.homeParts[1].MountPoint = "ntfs", "/mnt/data"
			if !strings.Contains(m.View(), "/dev/test2, /dev/test4") {
				t.Fatal("duplicates were filtered before counting")
			}
			next, cmd := m.Update(tea.KeyMsg{Type: tea.KeyEnter})
			if cmd != nil || next.(model).state != StateDisk {
				t.Fatal("duplicate labels allowed advancement")
			}
		}
	}
}

func TestHomeDiscoveryFailureBlocksBothPaths(t *testing.T) {
	for _, stage := range []coexistStage{coexistChoose, coexistInstall, coexistHomeLocation, coexistPrepare} {
		m := identityModel()
		m.coexistStage = stage
		m.refreshPartitionsWith(func() ([]PartitionInfo, error) { return nil, errors.New("lsblk failed") }, "")
		if !strings.Contains(m.View(), "lsblk failed") {
			t.Fatal("probe failure hidden")
		}
		next, cmd := m.updateDisk("enter")
		if cmd != nil || next.(model).coexistStage != stage {
			t.Fatal("probe failure treated as absent HOME")
		}
	}
}

func TestSharedHomeMustBeUsableOnlyWhenSelected(t *testing.T) {
	for _, p := range []PartitionInfo{
		{Path: "/dev/other1", Label: engine.SharedHomeLabel, FsType: "ntfs"},
		{Path: "/dev/other1", Label: engine.SharedHomeLabel, FsType: "ext4", MountPoint: "/home"},
		{Path: "/dev/other1", Label: engine.SharedHomeLabel, FsType: "ext4", ReadOnly: true},
	} {
		m := identityModel()
		m.homeParts, m.homeIdx = []PartitionInfo{p}, 0
		if m.coexistStorageError() != "" || m.selectedHomeError() == "" {
			t.Fatal("invalid shared HOME should only block its use")
		}
		m.coexistStage, m.prepareRootHome = coexistHomeLocation, false
		next, cmd := m.updateDisk("enter")
		if cmd != nil || next.(model).coexistStage != coexistHomeLocation {
			t.Fatal("unusable shared HOME allowed preparation")
		}
	}
}

func TestRootHomeSummaryPreservesOldSharedData(t *testing.T) {
	m := identityModel()
	m.homeNamespace, m.homeIdx = "debian", -1
	m.candidateParts = []PartitionInfo{{Path: "/dev/test3", Label: "arch"}}
	view := m.coexistResources()
	if strings.Contains(view, "/srv/homes/") || !strings.Contains(view, "EFI/arch") || !strings.Contains(view, "/home on ROOT") {
		t.Fatalf("local HOME summary describes wrong cleanup: %s", view)
	}
}

func TestRootHomePreparationReady(t *testing.T) {
	l, err := engine.CalculateCoexistLayoutWithoutHome("/dev/test", 22<<30, 512, engine.CoexistRootBytes)
	if err != nil {
		t.Fatal(err)
	}
	m := identityModel()
	m.prepareRootHome = true
	next, _ := m.receiveCoexistPreview(coexistPreviewMsg{layout: l})
	m = next.(model)
	if strings.Contains(m.viewCoexistInitialization(), "(remainder)") {
		t.Fatal("last ROOT described as shared HOME")
	}
	var parts []PartitionInfo
	for _, p := range l.Partitions {
		parts = append(parts, PartitionInfo{Path: p.Device, FsType: p.Filesystem, Label: p.Label, PartType: p.Type, IsEfi: p.Filesystem == "vfat"})
	}
	next, _ = m.receiveCoexistInitialization(coexistInitializedMsg{layout: l, parts: parts})
	m = next.(model)
	if m.coexistStage != coexistReady || m.homeIdx != -1 || len(m.homeParts) != 0 || len(m.candidateParts) != 2 {
		t.Fatal("ROOT-only preparation acquired shared HOME")
	}
}

func TestSharedHomeMultipleDisks(t *testing.T) {
	for _, tc := range []struct {
		sdaLabel, sdaPartLabel string
		sdbLabel, sdbPartLabel string
	}{
		{sdaLabel: "SHARED_HOMES", sdbLabel: "SHARED_HOMES"},
		{sdaLabel: "SHARED_HOME", sdbLabel: "SHARED_HOMES"},
		{sdaLabel: "SHARED_HOMES", sdbLabel: "SHARED_HOME"},
		{sdaPartLabel: "SHARED_HOMES", sdbPartLabel: "SHARED_HOMES"},
		{sdaLabel: "SHARED_HOMES", sdbPartLabel: "SHARED_HOMES"},
		{sdaPartLabel: "SHARED_HOMES", sdbLabel: "SHARED_HOMES"},
		{sdaPartLabel: "SHARED_HOME", sdbLabel: "SHARED_HOMES"},
	} {
		m := identityModel()
		m.disks = []DiskInfo{{Path: "/dev/sda"}, {Path: "/dev/sdb"}}
		parts := []PartitionInfo{
			{Disk: "/dev/sda", Path: "/dev/sda1", FsType: "vfat", PartType: "c12a7328-f81f-11d2-ba4b-00a0c93ec93b", IsEfi: true},
			{Disk: "/dev/sda", Path: "/dev/sda2", FsType: "ext4", Label: tc.sdaLabel, PartLabel: tc.sdaPartLabel},
			{Disk: "/dev/sda", Path: "/dev/sda3", FsType: "ext4"},
			{Disk: "/dev/sdb", Path: "/dev/sdb1", FsType: "ext4", Label: tc.sdbLabel, PartLabel: tc.sdbPartLabel},
		}
		m.refreshPartitionsWith(func() ([]PartitionInfo, error) { return parts, nil }, "")
		if err := m.coexistStorageError(); err == "" || !strings.Contains(err, "/dev/sda2") || !strings.Contains(err, "/dev/sdb1") {
			t.Fatalf("failed to detect duplicates across disks %+v: %s", tc, err)
		}
		if !strings.Contains(m.View(), "Storage check failed") {
			t.Fatalf("multiple disks view did not block: %s", m.View())
		}
		next, cmd := m.Update(tea.KeyMsg{Type: tea.KeyEnter})
		if cmd != nil || next.(model).state != StateDisk {
			t.Fatal("duplicate labels allowed advancement")
		}

		// Verify that attempting to choose Install distribution is blocked
		m.coexistStage = coexistChoose
		m.diskField = 1 // diskFieldInstall
		next, _ = m.updateDisk("enter")
		if next.(model).coexistStage == coexistInstall {
			t.Fatal("duplicate labels allowed entering coexistInstall")
		}

		// Verify that attempting to choose Prepare disk is blocked
		m.diskField = 2 // diskFieldPrepare
		next, _ = m.updateDisk("enter")
		if next.(model).coexistStage == coexistHomeLocation || next.(model).coexistStage == coexistPrepare {
			t.Fatal("duplicate labels allowed entering disk preparation")
		}
	}
}

func TestParseBlkidExport(t *testing.T) {
	raw := `DEVNAME=/dev/sda1
UUID=1234-ABCD
TYPE=vfat
PARTLABEL=EFI

DEVNAME=/dev/sda2
LABEL=SHARED_HOMES
TYPE=ext4

DEVNAME=/dev/sdb1
PARTLABEL=SHARED_HOMES
TYPE=ext4
`
	entries := engine.ParseBlkidExport(raw)
	if len(entries) != 3 {
		t.Fatalf("expected 3 entries, got %d", len(entries))
	}
	if entries[1].Path != "/dev/sda2" || entries[1].Label != "SHARED_HOMES" {
		t.Fatalf("unexpected entry 1: %+v", entries[1])
	}
	if entries[2].Path != "/dev/sdb1" || entries[2].PartLabel != "SHARED_HOMES" {
		t.Fatalf("unexpected entry 2: %+v", entries[2])
	}
}
