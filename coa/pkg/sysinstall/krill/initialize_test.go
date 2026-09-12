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

func initializedFixture(t *testing.T) (engine.CoexistDiskLayout, lsblkRoot) {
	t.Helper()
	l, err := engine.CalculateCoexistLayout("/dev/test", 64<<30, 512)
	if err != nil {
		t.Fatal(err)
	}
	d := lsblkItem{Path: l.Device, Type: "disk", Size: json.RawMessage(fmt.Sprint(l.DiskBytes)), TableType: "gpt"}
	for _, p := range l.Partitions {
		fs, partType, label := p.Filesystem, p.Type, "unrelated-label"
		d.Children = append(d.Children, lsblkItem{Path: p.Device, Type: "part", Size: json.RawMessage(fmt.Sprint(p.Sectors * l.SectorSize)), Start: p.Start * l.SectorSize / 512, FsType: &fs, PartType: &partType, Label: &label})
	}
	return l, lsblkRoot{BlockDevices: []lsblkItem{d}}
}

func TestInitializedDiscovery(t *testing.T) {
	for _, corrupt := range []string{"none", "missing", "extra", "table", "filesystem", "type", "size", "start", "mounted", "duplicate", "mapper", "disk"} {
		t.Run(corrupt, func(t *testing.T) {
			l, tree := initializedFixture(t)
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
	l, tree := initializedFixture(t)
	m := model{state: StateDisk, diskModeIdx: 2, disks: []DiskInfo{{Path: l.Device}}, homeNamespace: "untouched", termHeight: 18}
	if !slices.Contains(m.activeDiskFields(), diskFieldInitialize) {
		t.Fatal("missing initialization action")
	}
	m.diskField = slices.Index(m.activeDiskFields(), diskFieldInitialize)
	next, cmd := m.updateDisk("enter")
	if cmd == nil || next.(model).initialization == nil {
		t.Fatal("action did not dispatch preview")
	}
	// Execute preview with a read-only fixture; nothing destructive is dispatched.
	next, cmd = m.startCoexistPreview(func(device string) (engine.CoexistDiskLayout, error) {
		if device != l.Device {
			t.Fatal("wrong preview device")
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
	if !slices.Equal(events, []string{"initialize", "rediscover"}) || m.initialization != nil || m.state != StateDisk || m.diskError != "" {
		t.Fatalf("wrong completion: %v %s", events, m.diskError)
	}
	if m.candidateParts[m.partIdx].Path != l.Partitions[1].Device || m.efiParts[m.efiIdx].Path != l.Partitions[0].Device || m.homeParts[m.homeIdx].Path != l.Partitions[len(l.Partitions)-1].Device {
		t.Fatal("new partitions not selected")
	}
	if m.homeNamespace != "untouched" || m.installCh != nil {
		t.Fatal("initialization changed namespaces or started install")
	}
	m.diskField = slices.Index(m.activeDiskFields(), diskFieldTargetPart)
	next, _ = m.updateDisk("right")
	if next.(model).candidateParts[next.(model).partIdx].Path != l.Partitions[2].Device {
		t.Fatal("cannot change selected root")
	}
}

func TestInitializationFailureAndCancel(t *testing.T) {
	for _, failure := range []string{"initialize", "rediscover"} {
		l, _ := initializedFixture(t)
		m := model{state: StateDisk, diskModeIdx: 2, initialization: &coexistInitialization{layout: l, confirmation: l.Device, reviewed: true}}
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
		if m.state != StateDisk || m.diskError == "" || m.partIdx != -1 || m.efiIdx != -1 || m.homeIdx != -1 || len(m.candidateParts) != 0 {
			t.Fatal("failure accepted a layout or started installation")
		}
	}
	m := model{state: StateDisk, diskModeIdx: 2, partIdx: 3, initialization: &coexistInitialization{}}
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
