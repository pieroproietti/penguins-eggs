package krill

import (
	"slices"
	"strings"
	"testing"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
)

func TestEFISelectionIndependentOfHOME(t *testing.T) {
	m := model{
		state: StateDisk, debianEFI: true, diskModeIdx: 2,
		cfg: &InstallerConfig{}, homeNamespace: "my-home",
		disks: []DiskInfo{{Path: "/dev/test"}}, fsTypes: []string{"ext4"},
		userInputs: make([]textinput.Model, 5),
		locData:    TimezoneData{Regions: []string{"Europe"}, Zones: map[string][]string{"Europe": {"Rome"}}},
	}
	m.diskField = slices.Index(m.activeDiskFields(), diskFieldEFIID)
	if m.diskField < 0 {
		t.Fatal("missing EFI ID selector")
	}
	next, _ := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune("colibri-2")})
	m = next.(model)
	if m.efiBootloaderID != "colibri-2" || m.homeNamespace != "my-home" {
		t.Fatal("EFI and HOME fields are coupled or paste failed")
	}
	p := m.buildPlan()
	if p.EFIBootloaderID != "colibri-2" || p.HomeNamespace != "my-home" {
		t.Fatalf("separate IDs did not reach plan: %+v", p)
	}
	if !strings.Contains(m.coexistResources(), "EFI/colibri-2") {
		t.Fatal("EFI ID missing from confirmation")
	}
	for _, mode := range []int{0, 1} {
		m.diskModeIdx = mode
		if slices.Contains(m.activeDiskFields(), diskFieldEFIID) || m.buildPlan().EFIBootloaderID != "" {
			t.Fatal("normal install acquired a Coexist EFI ID")
		}
	}
	m.diskModeIdx, m.debianEFI = 2, false
	if slices.Contains(m.activeDiskFields(), diskFieldEFIID) || m.buildPlan().EFIBootloaderID != "" {
		t.Fatal("changed another family's EFI flow")
	}
}
