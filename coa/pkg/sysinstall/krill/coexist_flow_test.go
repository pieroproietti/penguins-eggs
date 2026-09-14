package krill

import (
	"slices"
	"strings"
	"testing"

	"coa/pkg/sysinstall/krill/engine"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

func TestCoexistInstallFitsStandardTerminal(t *testing.T) {
	m := identityModel()
	m.termWidth, m.termHeight = 80, 24
	m.partIdx, m.efiIdx, m.homeIdx = -1, -1, -1
	for _, message := range []string{
		"",
		"Select the root to FORMAT and existing shared HOME to PRESERVE.",
		engine.ValidateHomeNamespace("").Error(),
	} {
		m.diskError = message
		view := m.View()
		if height := lipgloss.Height(view); height > m.termHeight {
			t.Fatalf("installation form needs %d lines in a %d-line terminal", height, m.termHeight)
		}
		// The terminal wraps long validation messages; all words must survive.
		text := strings.Join(strings.Fields(view), " ")
		text = strings.ReplaceAll(text, " │ │ ", " ")
		for _, label := range []string{"Installation device", "Target partition", "EFI System Partition", "Home: /home on ROOT", "Installation ID", "type an ID", "Enter: continue"} {
			if !strings.Contains(view, label) {
				t.Fatalf("installation form missing %q", label)
			}
		}
		if !strings.Contains(text, message) {
			t.Fatalf("validation message was clipped: %s", view)
		}
	}
}

func TestCoexistPaths(t *testing.T) {
	for _, action := range []diskFieldKind{diskFieldPrepare, diskFieldInstall} {
		m := model{state: StateDisk, diskModeIdx: 2, disks: []DiskInfo{{Path: "/dev/test"}}, fsTypes: []string{"ext4"}}
		for _, label := range []string{"Prepare a disk", "Install a distribution"} {
			if !strings.Contains(m.View(), label) {
				t.Fatalf("Coexist menu missing %q", label)
			}
		}
		// Enter on the mode selector must not submit an installation.
		next, cmd := m.Update(tea.KeyMsg{Type: tea.KeyEnter})
		m = next.(model)
		if cmd != nil || m.coexistStage != coexistChoose || m.state != StateDisk {
			t.Fatal("mode selector bypassed the Coexist menu")
		}
		m.diskField = slices.Index(m.activeDiskFields(), action)
		next, cmd = m.Update(tea.KeyMsg{Type: tea.KeyEnter})
		m = next.(model)
		if cmd != nil || m.initialization != nil || m.installCh != nil {
			t.Fatal("choosing a path dispatched disk operations")
		}
		if action == diskFieldPrepare {
			if m.coexistStage != coexistHomeLocation || !strings.Contains(m.View(), "Home location for disk preparation") {
				t.Fatal("preparation did not start with HOME location")
			}
			next, cmd = m.Update(tea.KeyMsg{Type: tea.KeyEnter})
			m = next.(model)
			if cmd != nil {
				t.Fatal("HOME location dispatched disk operations")
			}
			if m.coexistStage != coexistPrepare || slices.Contains(m.activeDiskFields(), diskFieldTargetPart) || strings.Contains(m.View(), "Installation ID") {
				t.Fatal("preparation includes installation settings")
			}
			if !strings.Contains(m.View(), "ALL DATA") || !strings.Contains(m.View(), "Configure partitions") {
				t.Fatal("preparation omits layout action or destructive warning")
			}
		} else {
			if m.coexistStage != coexistInstall || slices.Contains(m.activeDiskFields(), diskFieldInitialize) || strings.Contains(m.View(), "Configure partitions") {
				t.Fatal("installation offers disk preparation")
			}
		}
		next, cmd = m.Update(tea.KeyMsg{Type: tea.KeyEsc})
		m = next.(model)
		if cmd != nil || m.coexistStage != coexistChoose || m.activeDiskFields()[m.diskField] != action {
			t.Fatal("Esc did not return to the selected menu action")
		}
	}
}

func TestCoexistPreparationIsUnavailableInOtherPaths(t *testing.T) {
	l, _ := initializedFixture(t, engine.CoexistRootBytes)
	for _, stage := range []coexistStage{coexistChoose, coexistInstall, coexistReady} {
		m := model{diskModeIdx: 2, coexistStage: stage, disks: []DiskInfo{{Path: l.Device}},
			initialization: &coexistInitialization{layout: l, reviewed: true, confirmation: l.Device}}
		if _, cmd := m.startCoexistPreview(nil); cmd != nil {
			t.Fatal("preparation accessible outside preparation path")
		}
		if _, cmd := m.confirmCoexistInitialization(nil, nil); cmd != nil {
			t.Fatal("destructive operation accessible outside preparation path")
		}
	}
}

func TestCoexistReadyCanExitWithoutInstallingOrRestarting(t *testing.T) {
	l, tree := initializedFixture(t, engine.CoexistRootBytes)
	parts, err := validateInitializedDiscovery(l, tree)
	if err != nil {
		t.Fatal(err)
	}
	m := model{state: StateDisk, diskModeIdx: 2, coexistStage: coexistPrepare,
		disks: []DiskInfo{{Path: l.Device}}, restartEnabled: true, restartChecked: true}
	next, cmd := m.Update(coexistInitializedMsg{layout: l, parts: parts})
	m = next.(model)
	if cmd != nil || m.coexistStage != coexistReady || m.coexistReadyChoice != 1 || m.installCh != nil {
		t.Fatal("preparation did not stop at the completion screen")
	}
	if view := m.View(); !strings.Contains(view, "Disk ready") || !strings.Contains(view, "No distribution has been installed") {
		t.Fatal("completion claims installation success or omits preparation success")
	}
	for _, key := range []tea.KeyType{tea.KeyEnter, tea.KeyEsc, tea.KeyCtrlC} {
		next, cmd := m.Update(tea.KeyMsg{Type: key})
		if cmd == nil {
			t.Fatal("exit did not quit")
		}
		if _, ok := cmd().(tea.QuitMsg); !ok || next.(model).installCh != nil {
			t.Fatal("exit started installation or restart")
		}
	}
}

func TestCoexistMissingESPGuidance(t *testing.T) {
	m := identityModel()
	m.efiParts = nil
	m.efiIdx, m.diskField = -1, 0
	m.termWidth, m.termHeight = 80, 24
	for _, key := range []string{"", "tab", "enter"} {
		if key != "" {
			next, cmd := m.updateDisk(key)
			m = next.(model)
			if cmd != nil || m.state != StateDisk || m.initialization != nil || m.installCh != nil {
				t.Fatal("missing ESP dispatched an operation or advanced installation")
			}
		}
		view := m.View()
		for _, text := range []string{"/dev/test", "Installation is blocked", "GParted", "unallocated space", "Resize/Move", "FAT32", "512 MiB", "enable esp", "GPT is required", "restart Krill", "choose another disk"} {
			if !strings.Contains(view, text) {
				t.Fatalf("guidance missing %q: %s", text, view)
			}
		}
		if lipgloss.Height(view) > 24 || lipgloss.Width(view) > 80 {
			t.Fatalf("guidance does not fit 80x24: %dx%d", lipgloss.Width(view), lipgloss.Height(view))
		}
		if fields := m.activeDiskFields(); len(fields) != 1 || fields[0] != diskFieldDevice {
			t.Fatal("missing ESP offered hidden installation fields")
		}
	}
	next, cmd := m.updateDisk("esc")
	if cmd != nil || next.(model).coexistStage != coexistChoose {
		t.Fatal("guidance prevented return to Coexist menu")
	}
}
