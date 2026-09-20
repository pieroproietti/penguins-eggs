package krill

import (
	"slices"
	"strings"
	"testing"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
)

func identityModel() model {
	m := model{
		state: StateDisk, diskModeIdx: 2, coexistStage: coexistInstall,
		diskModes: []string{"Erase disk", "Pre-partitioned disk", "Coexist with existing installations"},
		cfg:       &InstallerConfig{},
		disks:     []DiskInfo{{Path: "/dev/test"}}, fsTypes: []string{"ext4"},
		userInputs: make([]textinput.Model, 5),
		locData:    TimezoneData{Regions: []string{"Europe"}, Zones: map[string][]string{"Europe": {"Rome"}}},
		efiParts:   []PartitionInfo{{Path: "/dev/test1"}},
	}
	m.diskField = slices.Index(m.activeDiskFields(), diskFieldNamespace)
	return m
}

func TestInstallationIDPropagation(t *testing.T) {
	for _, mode := range []int{0, 1} {
		m := identityModel()
		next, _ := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune("colibri-2"), Paste: true})
		m = next.(model)
		p := m.buildPlan()
		if m.diskError != "" || p.EFIBootloaderID != "colibri-2" || p.Hostname != "colibri-2" {
			t.Fatalf("Installation ID did not reach plan: %+v, error %q", p, m.diskError)
		}
		view := m.viewDisk()
		if !strings.Contains(view, "System Name (ID)") || strings.Contains(view, "HOME namespace (type)") || strings.Contains(view, "EFI bootloader ID (type)") {
			t.Fatal("expected one System Name (ID) input")
		}
		m.diskModeIdx = mode
		p = m.buildPlan()
		if slices.Contains(m.activeDiskFields(), diskFieldNamespace) || p.EFIBootloaderID != "" {
			t.Fatal("normal install acquired a Coexist identity")
		}
	}
}

func TestInstallationIDInputRejectsWithoutSanitizing(t *testing.T) {
	for _, id := range []string{"Colibri-1", "colibri_1", "-colibri", "colibri-", "more-than-16-characters", "colibri 1", "colibrì", "a/b", strings.Repeat("a", 17)} {
		t.Run(id, func(t *testing.T) {
			m := identityModel()
			next, _ := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune(id), Paste: true})
			m = next.(model)
			if m.systemID != id || m.diskError == "" {
				t.Fatalf("invalid input was altered or accepted: %q, error %q", m.systemID, m.diskError)
			}
			next, _ = m.updateDisk("enter")
			m = next.(model)
			if m.state != StateDisk || m.systemID != id {
				t.Fatal("invalid identity advanced or changed on submission")
			}
			for range []rune(id) {
				next, _ = m.updateDisk("backspace")
				m = next.(model)
			}
			next, _ = m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune(strings.Repeat("a", 16))})
			m = next.(model)
			if m.diskError != "" || m.buildPlan().Hostname != strings.Repeat("a", 16) {
				t.Fatalf("corrected 16-character ID rejected: %q", m.diskError)
			}
		})
	}
}
