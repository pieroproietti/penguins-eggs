package krill

import (
	"strings"
	"testing"

	"coa/pkg/sysinstall/krill/engine"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

func TestSharedHomeSelection(t *testing.T) {
	m := model{state: StateDisk, diskModeIdx: 2, coexistStage: coexistHomeLocation,
		termWidth: 80, termHeight: 24, disks: []DiskInfo{{Path: "/dev/test"}},
		homeParts: []PartitionInfo{
			{Path: "/dev/mounted1", FsType: "ext4", MountPoint: "/home"},
			{Path: "/dev/other1", FsType: "ext4", Size: "100G"},
			{Path: "/dev/other2", FsType: "ntfs"},
		},
	}
	view := m.View()
	for _, text := range []string{"Shared Home Location", "(•) Coexist disk", "32 GiB", "( ) External partition"} {
		if !strings.Contains(view, text) {
			t.Fatalf("location screen missing %q", text)
		}
	}
	if lipgloss.Height(view) > 24 || lipgloss.Width(view) > 80 {
		t.Fatal("HOME location screen does not fit 80x24")
	}
	for _, key := range []tea.KeyType{tea.KeyDown, tea.KeyEnter, tea.KeyEnter} {
		next, cmd := m.Update(tea.KeyMsg{Type: key})
		m = next.(model)
		if cmd != nil || m.initialization != nil || m.installCh != nil {
			t.Fatal("HOME choice dispatched disk operations")
		}
	}
	if m.coexistStage != coexistHomePartition || m.diskError == "" {
		t.Fatal("advanced without explicitly selecting an external partition")
	}
	for _, key := range []tea.KeyType{tea.KeyRight, tea.KeyEnter} {
		next, cmd := m.Update(tea.KeyMsg{Type: key})
		m = next.(model)
		if cmd != nil {
			t.Fatal("selection dispatched disk operations")
		}
	}
	if m.coexistStage != coexistPrepare || m.prepareHome.Path != "/dev/other1" || !m.homeExternal {
		t.Fatal("external partition was not carried to preparation")
	}
	// Changing the target disk refreshes ordinary installation selections, but
	// must retain the explicit external HOME choice for the initializer's probe.
	m.refreshPartitionsWith(func(string) []PartitionInfo { return nil }, "", nil)
	if m.prepareHome.Path != "/dev/other1" {
		t.Fatal("disk refresh lost external HOME")
	}
	m.coexistStage = coexistHomeLocation
	for _, key := range []string{"up", "enter"} {
		next, _ := m.updateSharedHome(key)
		m = next.(model)
	}
	if m.homeExternal || m.prepareHome.Path != "" || m.coexistStage != coexistPrepare {
		t.Fatal("switching to local HOME retained external selection")
	}
}

func TestExternalHomeEmptyCandidatesAndCancellation(t *testing.T) {
	m := model{state: StateDisk, diskModeIdx: 2, coexistStage: coexistHomePartition, homeExternal: true, externalHomeIdx: -1}
	if !strings.Contains(m.viewSharedHome(), "No unmounted ext4") {
		t.Fatal("empty selector lacks explanation")
	}
	for _, key := range []string{"right", "enter"} {
		next, cmd := m.updateSharedHome(key)
		m = next.(model)
		if cmd != nil || m.coexistStage != coexistHomePartition {
			t.Fatal("empty HOME selector advanced")
		}
	}
	for _, want := range []coexistStage{coexistHomeLocation, coexistChoose} {
		next, cmd := m.updateDisk("esc")
		m = next.(model)
		if cmd != nil || m.coexistStage != want {
			t.Fatal("Esc did not navigate back")
		}
	}
	m.coexistStage, m.disks = coexistPrepare, []DiskInfo{{Path: "/dev/test"}}
	if next, cmd := m.startCoexistPreview(nil); cmd != nil || next.(model).diskError == "" {
		t.Fatal("missing external selection fell back to local HOME")
	}
}

func TestExternalHomeReadySelectionAndPreview(t *testing.T) {
	m := identityModel()
	external := engine.SharedHomePartition{Partition: "/dev/other1", UUID: "home-uuid", SizeBytes: 100 << 30}
	l, err := engine.CalculateCoexistLayoutWithHome("/dev/test", 22<<30, 512, engine.CoexistRootBytes, external)
	if err != nil {
		t.Fatal(err)
	}
	m.homeExternal, m.prepareHome = true, PartitionInfo{Path: external.Partition, FsType: "ext4"}
	m.coexistStage = coexistPrepare
	next, _ := m.receiveCoexistPreview(coexistPreviewMsg{layout: l})
	m = next.(model)
	view := m.viewCoexistInitialization()
	if strings.Contains(view, "SHARED_HOMES") || strings.Contains(view, "(remainder)") || !strings.Contains(view, external.Partition) {
		t.Fatalf("incorrect external HOME preview: %s", view)
	}
	var parts []PartitionInfo
	for _, p := range l.Partitions {
		parts = append(parts, PartitionInfo{Path: p.Device, FsType: p.Filesystem, PartType: p.Type, IsEfi: p.Filesystem == "vfat"})
	}
	m.homeParts = nil // confirmation discards stale installation choices
	next, _ = m.receiveCoexistInitialization(coexistInitializedMsg{layout: l, parts: parts})
	m = next.(model)
	if m.coexistStage != coexistReady || m.homeIdx < 0 || m.homeParts[m.homeIdx].Path != external.Partition {
		t.Fatal("ready screen selected a ROOT as HOME or lost external HOME")
	}
	m.coexistReadyChoice = 0
	next, _ = m.updateCoexistReady("enter")
	m = next.(model)
	if p := m.buildPlan(); p.HomePartition != external.Partition || p.TargetPartition != "/dev/test2" || p.EspPartition != "/dev/test1" {
		t.Fatalf("external HOME was not passed to the existing installation engine: %+v", p)
	}
}
