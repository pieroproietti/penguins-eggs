package krill

import (
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strings"
	"testing"

	"coa/pkg/sysinstall/krill/engine"
	tea "github.com/charmbracelet/bubbletea"
)

func initializedFixture(t *testing.T, rootBytes uint64) (engine.CoexistDiskLayout, lsblkRoot) {
	t.Helper()
	l, err := engine.CalculateCoexistLayout("/dev/test", 64<<30, 512, rootBytes)
	if err != nil {
		t.Fatal(err)
	}
	d := lsblkItem{Path: l.Device, Type: "disk", Size: json.RawMessage(fmt.Sprint(l.DiskBytes)), TableType: "gpt"}
	for _, p := range l.Partitions {
		fs, partType, label := p.Filesystem, p.Type, p.Label
		d.Children = append(d.Children, lsblkItem{Path: p.Device, Type: "part", Size: json.RawMessage(fmt.Sprint(p.Sectors * l.SectorSize)), Start: p.Start * l.SectorSize / 512, FsType: &fs, PartType: &partType, Label: &label})
	}
	return l, lsblkRoot{BlockDevices: []lsblkItem{d}}
}

func TestInitializedDiscovery(t *testing.T) {
	for _, corrupt := range []string{"none", "missing", "extra", "table", "filesystem", "type", "size", "start", "mounted", "duplicate", "mapper", "disk"} {
		t.Run(corrupt, func(t *testing.T) {
			l, tree := initializedFixture(t, engine.CoexistRootBytes)
			d := &tree.BlockDevices[0]
			switch corrupt {
			case "missing":
				d.Children = d.Children[:len(d.Children)-1]
			case "extra":
				d.Children = append(d.Children, d.Children[0])
			case "table":
				d.TableType = "dos"
			case "filesystem":
				d.Children[1].FsType = nil
			case "type":
				wrong := "0xef"
				d.Children[0].PartType = &wrong
			case "size":
				d.Children[len(d.Children)-1].Size = json.RawMessage("1024")
			case "start":
				d.Children[1].Start++
			case "mounted":
				d.Children[1].MountPoints = []string{"", "/mnt"}
			case "duplicate":
				d.Children[1] = d.Children[0]
			case "mapper":
				d.Children[1].Children = []lsblkItem{{Type: "crypt"}}
			case "disk":
				d.Path = "/dev/other"
			}
			parts, err := validateInitializedDiscovery(l, tree)
			if corrupt == "none" {
				if err != nil || len(parts) != len(l.Partitions) {
					t.Fatalf("valid layout: %v", err)
				}
			} else if err == nil || len(parts) != 0 {
				t.Fatalf("accepted %s layout", corrupt)
			}
		})
	}
}

func TestInitializeCoexistConfirmationAndRediscovery(t *testing.T) {
	l, tree := initializedFixture(t, engine.CoexistRootBytes)
	m := model{state: StateDisk, diskModeIdx: 2, coexistStage: coexistPrepare, disks: []DiskInfo{{Path: l.Device}}, homeNamespace: "untouched", termHeight: 18}
	if !slices.Contains(m.activeDiskFields(), diskFieldInitialize) {
		t.Fatal("missing initialization action")
	}
	m.diskField = slices.Index(m.activeDiskFields(), diskFieldInitialize)
	next, cmd := m.updateDisk("enter")
	m = next.(model)
	if cmd != nil || m.initialization == nil || !m.initialization.editingSize {
		t.Fatal("action did not open root size input before preview")
	}
	// Execute preview with a read-only fixture; nothing destructive is dispatched.
	next, cmd = m.startCoexistPreview(func(device string, rootBytes uint64) (engine.CoexistDiskLayout, error) {
		if device != l.Device || rootBytes != 10<<30 {
			t.Fatal("wrong preview device or default size")
		}
		return l, nil
	})
	m = next.(model)
	next, _ = m.Update(cmd())
	m = next.(model)
	if m.state != StateDisk || m.initialization.busy || m.initialization.reviewed {
		t.Fatal("preview skipped review")
	}
	if !strings.Contains(m.viewDisk(), l.Partitions[0].Device) {
		t.Fatal("preview omits ESP")
	}
	var events []string
	initialize := func(got engine.CoexistDiskLayout, confirmation string) error {
		events = append(events, "initialize")
		if got.Device != l.Device || confirmation != l.Device {
			t.Fatal("wrong confirmed device")
		}
		return nil
	}
	discover := func(got engine.CoexistDiskLayout) ([]PartitionInfo, error) {
		events = append(events, "rediscover")
		return validateInitializedDiscovery(got, tree)
	}
	for _, confirmation := range []string{"", "yes", "/dev/other", l.Device} {
		m.initialization.confirmation = confirmation
		_, cmd = m.confirmCoexistInitialization(initialize, discover)
		if cmd != nil {
			t.Fatal("dispatched before full layout reviewed")
		}
	}
	next, _ = m.updateCoexistInitialization(tea.KeyMsg{Type: tea.KeyEnd})
	m = next.(model)
	if !m.initialization.reviewed || !strings.Contains(m.viewDisk(), "SHARED_HOMES") {
		t.Fatal("final HOME not shown")
	}
	m.initialization.confirmation = "yes"
	_, cmd = m.confirmCoexistInitialization(initialize, discover)
	if cmd != nil {
		t.Fatal("accepted vague destructive confirmation")
	}
	m.initialization.confirmation = l.Device
	next, cmd = m.confirmCoexistInitialization(initialize, discover)
	m = next.(model)
	if cmd == nil || m.state != StateDisk || m.partIdx != -1 {
		t.Fatal("initialization dispatch")
	}
	next, _ = m.Update(cmd())
	m = next.(model)
	if !slices.Equal(events, []string{"initialize", "rediscover"}) || m.initialization != nil || m.state != StateDisk || m.coexistStage != coexistReady || m.diskError != "" {
		t.Fatalf("wrong completion: %v %s", events, m.diskError)
	}
	if m.candidateParts[m.partIdx].Path != l.Partitions[1].Device || m.efiParts[m.efiIdx].Path != l.Partitions[0].Device || m.homeIdx != -1 || len(m.homeParts) != 1 || m.homeParts[0].Path != l.Partitions[len(l.Partitions)-1].Device {
		t.Fatal("new partitions not selected")
	}
	if m.homeNamespace != "untouched" || m.installCh != nil {
		t.Fatal("initialization changed namespaces or started install")
	}
	// Continuing requires a separate choice and opens settings, not installation.
	next, cmd = m.Update(tea.KeyMsg{Type: tea.KeyUp})
	m = next.(model)
	if cmd != nil || m.coexistReadyChoice != 0 || m.coexistStage != coexistReady {
		t.Fatal("selecting install now left the completion screen before confirmation")
	}
	next, cmd = m.Update(tea.KeyMsg{Type: tea.KeyEnter})
	m = next.(model)
	if cmd != nil || m.coexistStage != coexistInstall || m.installCh != nil {
		t.Fatal("continue did not open installation settings")
	}
	m.diskField = slices.Index(m.activeDiskFields(), diskFieldTargetPart)
	next, _ = m.updateDisk("right")
	if next.(model).candidateParts[next.(model).partIdx].Path != l.Partitions[2].Device {
		t.Fatal("cannot change selected root")
	}
}

func TestInitializationFailureAndCancel(t *testing.T) {
	for _, failure := range []string{"initialize", "rediscover"} {
		l, _ := initializedFixture(t, engine.CoexistRootBytes)
		m := model{state: StateDisk, diskModeIdx: 2, coexistStage: coexistPrepare, initialization: &coexistInitialization{layout: l, confirmation: l.Device, reviewed: true}}
		next, cmd := m.confirmCoexistInitialization(func(engine.CoexistDiskLayout, string) error {
			if failure == "initialize" {
				return errors.New("mkfs failed")
			}
			return nil
		}, func(engine.CoexistDiskLayout) ([]PartitionInfo, error) {
			if failure == "initialize" {
				t.Fatal("rediscovered after failed mkfs")
			}
			return nil, errors.New("partial table")
		})
		m = next.(model)
		next, _ = m.Update(cmd())
		m = next.(model)
		if m.state != StateDisk || m.coexistStage != coexistPrepare || m.diskError == "" || m.partIdx != -1 || m.efiIdx != -1 || m.homeIdx != -1 || len(m.candidateParts) != 0 {
			t.Fatal("failure accepted a layout or started installation")
		}
	}
	m := model{state: StateDisk, diskModeIdx: 2, coexistStage: coexistPrepare, partIdx: 3, initialization: &coexistInitialization{}}
	next, cmd := m.updateCoexistInitialization(tea.KeyMsg{Type: tea.KeyEsc})
	if cmd != nil || next.(model).initialization != nil || next.(model).partIdx != 3 {
		t.Fatal("cancel changed existing layout")
	}
	for _, mode := range []int{0, 1} {
		m.diskModeIdx = mode
		if slices.Contains(m.activeDiskFields(), diskFieldInitialize) {
			t.Fatal("initialization offered outside Coexist")
		}
	}
}

func TestInitializationRootSizeEditing(t *testing.T) {
	l, _ := initializedFixture(t, engine.CoexistRootBytes)
	m := model{state: StateDisk, diskModeIdx: 2, coexistStage: coexistPrepare, disks: []DiskInfo{{Path: l.Device}}, termWidth: 80, termHeight: 24}
	m.diskField = slices.Index(m.activeDiskFields(), diskFieldInitialize)
	next, cmd := m.Update(tea.KeyMsg{Type: tea.KeyEnter})
	m = next.(model)
	if cmd != nil || m.initialization == nil || !m.initialization.editingSize || m.initialization.rootSize != "10" {
		t.Fatal("initializer did not open an editable input defaulting to 10 GiB")
	}
	if view := m.viewDisk(); !strings.Contains(view, "Root partition size (GiB): [10]") || strings.Contains(view, "ERASE") || strings.Contains(view, "root1") {
		t.Fatalf("size input missing or preview shown before input: %s", view)
	}
	next, _ = m.Update(tea.KeyMsg{Type: tea.KeyBackspace})
	m = next.(model)
	next, _ = m.Update(tea.KeyMsg{Type: tea.KeyBackspace})
	m = next.(model)
	next, _ = m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune("16")})
	m = next.(model)
	if view := m.viewDisk(); !strings.Contains(view, "Root partition size (GiB): [16]") || strings.Contains(view, "root1") {
		t.Fatalf("edited input missing or unapplied layout shown: %s", view)
	}
	_, cmd = m.confirmCoexistInitialization(nil, nil)
	if cmd != nil {
		t.Fatal("size editing dispatched partitioning")
	}
	next, cmd = m.Update(tea.KeyMsg{Type: tea.KeyEnter})
	m = next.(model)
	if cmd == nil || !m.initialization.busy {
		t.Fatal("Enter did not request a new preview")
	}
	// Replace only the disk probe; no real disk operations run in the test.
	l, tree := initializedFixture(t, 16<<30)
	next, cmd = m.startCoexistPreview(func(device string, rootBytes uint64) (engine.CoexistDiskLayout, error) {
		if device != l.Device || rootBytes != 16<<30 {
			t.Fatal("edited size did not reach the preview")
		}
		return engine.CalculateCoexistLayout(device, 64<<30, 512, rootBytes)
	})
	m = next.(model)
	next, _ = m.Update(cmd())
	m = next.(model)
	if m.initialization.editingSize || m.initialization.confirmation != "" || m.initialization.layout.RootBytes != 16<<30 {
		t.Fatal("new preview retained stale size or confirmation")
	}
	view := m.viewCoexistInitialization()
	if strings.Count(view, "16.00 GiB") != 3 || !strings.Contains(view, "SHARED_HOMES") || !strings.Contains(view, "15.50 GiB") || !strings.Contains(view, "0.50 GiB") {
		t.Fatalf("new layout not shown before confirmation: %s", view)
	}
	_, cmd = m.confirmCoexistInitialization(nil, nil)
	if cmd != nil {
		t.Fatal("recalculation reused old confirmation")
	}
	m.initialization.confirmation = l.Device
	next, cmd = m.confirmCoexistInitialization(func(got engine.CoexistDiskLayout, confirmation string) error {
		if got.RootBytes != 16<<30 || len(got.Partitions) != 5 || confirmation != l.Device {
			t.Fatal("wrong layout passed to initialization")
		}
		return nil
	}, func(got engine.CoexistDiskLayout) ([]PartitionInfo, error) {
		return validateInitializedDiscovery(got, tree)
	})
	m = next.(model)
	if cmd == nil {
		t.Fatal("reviewed custom layout could not be confirmed")
	}
	next, _ = m.Update(cmd())
	m = next.(model)
	if m.initialization != nil || m.diskError != "" || len(m.candidateParts) != 3 {
		t.Fatal("custom layout rediscovery failed")
	}
}

func TestInitializationRootSizeReeditingClearsConfirmation(t *testing.T) {
	l, _ := initializedFixture(t, engine.CoexistRootBytes)
	m := model{state: StateDisk, diskModeIdx: 2, coexistStage: coexistPrepare}
	next, _ := m.receiveCoexistPreview(coexistPreviewMsg{layout: l})
	m = next.(model)
	m.initialization.reviewed, m.initialization.confirmation = true, l.Device
	next, _ = m.Update(tea.KeyMsg{Type: tea.KeyTab})
	m = next.(model)
	if !m.initialization.editingSize || m.initialization.reviewed || m.initialization.confirmation != "" {
		t.Fatal("editing retained destructive confirmation")
	}
	if _, cmd := m.confirmCoexistInitialization(nil, nil); cmd != nil {
		t.Fatal("size editing dispatched partitioning")
	}
}

func TestInitializationInvalidRootSize(t *testing.T) {
	for _, size := range []string{"", "0", "-1", "1", "3", "1.5", "abc", "16GiB", "é", "18446744073709551616", "18446744073709551615", "17179869184"} {
		t.Run(size, func(t *testing.T) {
			l, _ := initializedFixture(t, engine.CoexistRootBytes)
			m := model{diskModeIdx: 2, coexistStage: coexistPrepare, disks: []DiskInfo{{Path: l.Device}}, initialization: &coexistInitialization{layout: l, rootSize: size, editingSize: true}}
			next, cmd := m.startCoexistPreview(func(string, uint64) (engine.CoexistDiskLayout, error) {
				t.Fatal("invalid size reached disk probing")
				return l, nil
			})
			m = next.(model)
			if cmd != nil || m.initialization.sizeError == "" || m.initialization.rootSize != size {
				t.Fatal("invalid size was changed or accepted")
			}
			m.initialization.reviewed, m.initialization.confirmation = true, l.Device
			if _, cmd := m.confirmCoexistInitialization(nil, nil); cmd != nil {
				t.Fatal("invalid size allowed destructive confirmation")
			}
		})
	}
}

func TestInitializationInsufficientSpaceCanBeCorrected(t *testing.T) {
	for _, tc := range []struct {
		diskGiB, badGiB, goodGiB uint64
	}{{64, 27, 16}, {25, 8, 4}} {
		l, err := engine.CalculateCoexistLayout("/dev/test", tc.diskGiB<<30, 512, tc.badGiB<<30)
		if err == nil {
			t.Fatal("oversized roots accepted")
		}
		m := model{diskModeIdx: 2, coexistStage: coexistPrepare, disks: []DiskInfo{{Path: l.Device}}}
		next, _ := m.receiveCoexistPreview(coexistPreviewMsg{layout: l, err: err})
		m = next.(model)
		if m.initialization == nil || !m.initialization.editingSize || m.initialization.reviewed || !strings.Contains(m.viewCoexistInitialization(), err.Error()) {
			t.Fatal("insufficient space did not return to size editing")
		}
		m.initialization.rootSize = fmt.Sprint(tc.goodGiB)
		next, cmd := m.startCoexistPreview(func(device string, rootBytes uint64) (engine.CoexistDiskLayout, error) {
			return engine.CalculateCoexistLayout(device, tc.diskGiB<<30, 512, rootBytes)
		})
		m = next.(model)
		next, _ = m.Update(cmd())
		m = next.(model)
		if m.initialization.editingSize || m.initialization.sizeError != "" || m.initialization.layout.RootBytes != tc.goodGiB<<30 {
			t.Fatal("corrected size was not accepted")
		}
	}
}
