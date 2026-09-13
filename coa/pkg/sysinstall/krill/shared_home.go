package krill

import (
	"strings"

	tea "github.com/charmbracelet/bubbletea"
)

func (m model) sharedHomeDescription() string {
	if m.homeExternal {
		return m.prepareHome.Path + " (external partition, no formatting)"
	}
	return "Coexist disk, at least 10 GiB"
}

// The destination disk is chosen after the HOME location. Its independence
// from this partition is checked by the engine before preview and before wipe.
func (m model) externalHomeCandidates() []PartitionInfo {
	var parts []PartitionInfo
	for _, p := range m.homeParts {
		if p.FsType == "ext4" && !p.IsEfi && p.MountPoint == "" {
			parts = append(parts, p)
		}
	}
	return parts
}

func (m model) viewSharedHome() string {
	if m.coexistStage == coexistHomePartition {
		parts := m.externalHomeCandidates()
		selection := "SELECT PARTITION"
		if len(parts) == 0 {
			selection = "No unmounted ext4 partitions available"
		} else if m.externalHomeIdx >= 0 && m.externalHomeIdx < len(parts) {
			selection = parts[m.externalHomeIdx].DisplayString()
		}
		return strings.Join([]string{
			renderSteps(4), "", "External partition", "",
			m.selectorRow(true, "Shared HOME", selection), "",
			"Choose an existing, unmounted ext4 partition on another disk.",
			"The external partition will not be formatted during preparation.",
			m.diskError, "←/→ select partition | Enter: continue | Esc: location options",
		}, "\n")
	}
	a, b := "(•) ", "( ) "
	if m.homeExternal {
		a, b = b, a
	}
	return strings.Join([]string{
		renderSteps(4), "", "Shared Home Location", "",
		a + "Coexist disk (requires 32 GiB total space)", "",
		b + "External partition", "",
		"Default ROOT slots: 10 GiB each; local HOME: at least 10 GiB.",
		"↑/↓ select | Enter: continue | Esc: Coexist menu",
	}, "\n")
}

func (m model) updateSharedHome(key string) (tea.Model, tea.Cmd) {
	if m.coexistStage == coexistHomeLocation {
		switch key {
		case "up", "down", "left", "right", "tab", "shift+tab", " ":
			m.homeExternal = !m.homeExternal
		case "esc":
			m.coexistStage, m.diskField, m.diskError = coexistChoose, 2, ""
		case "enter":
			m.diskError = ""
			if m.homeExternal {
				m.coexistStage, m.externalHomeIdx = coexistHomePartition, -1
			} else {
				m.prepareHome = PartitionInfo{}
				m.coexistStage, m.diskField = coexistPrepare, 0
			}
		}
		return m, nil
	}
	parts := m.externalHomeCandidates()
	switch key {
	case "esc":
		m.coexistStage, m.diskError = coexistHomeLocation, ""
	case "left", "up", "shift+tab", "right", "down", "tab":
		if len(parts) > 0 {
			delta := 1
			if key == "left" || key == "up" || key == "shift+tab" {
				delta = -1
			}
			m.externalHomeIdx = cycle(m.externalHomeIdx, delta, len(parts))
			m.diskError = ""
		}
	case "enter":
		if m.externalHomeIdx < 0 || m.externalHomeIdx >= len(parts) {
			m.diskError = "Select an existing ext4 partition for shared HOME."
			return m, nil
		}
		m.prepareHome = parts[m.externalHomeIdx]
		m.coexistStage, m.diskField, m.diskError = coexistPrepare, 0, ""
	}
	return m, nil
}
