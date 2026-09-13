package krill

import (
	"strings"

	tea "github.com/charmbracelet/bubbletea"
)

// These paths only affect the TUI; installation still uses the Coexist engine.
type coexistStage int

const (
	coexistChoose coexistStage = iota
	coexistPrepare
	coexistInstall
	coexistReady
)

func (m model) coexistActionRow(active bool, label string) string {
	if active {
		return cyanText.Render("→ " + label)
	}
	return "  " + label
}

func (m model) viewCoexistChoice() string {
	return strings.Join([]string{
		renderSteps(4), "",
		m.selectorRow(m.diskField == 0, "Installation mode", "Coexist"), "",
		m.coexistActionRow(m.diskField == 1, "Install a distribution on a prepared disk"),
		"    Choose a ROOT slot and reuse existing ESP and shared HOME.", "",
		m.coexistActionRow(m.diskField == 2, "Prepare a disk for multiple distributions"),
		"    Create ESP, ROOT slots and shared HOME.",
		"    " + redBgWhiteText.Render("WARNING: Completely destructive. Erases ALL DATA on the selected disk."), "",
		"↑/↓ select action | ←/→ change installation mode | Enter: open",
	}, "\n")
}

func (m model) viewCoexistPreparation() string {
	device := m.disks[m.diskIdx]
	return strings.Join([]string{
		renderSteps(4), "", cyanText.Render("Coexist — Disk preparation"), "",
		m.selectorRow(m.diskField == 0, "Disk to prepare", device.Path+" ("+device.Size+")"),
		m.coexistActionRow(m.diskField == 1, "Configure partitions and review layout"), "",
		"Choose the ROOT slot size; ESP and shared HOME are created automatically.",
		redBgWhiteText.Render("Preparation erases ALL DATA on the selected disk."),
		"To add a distribution to a prepared disk, use the installation path.",
		m.diskError, "↑/↓ select | ←/→ change disk | Esc: Coexist menu",
	}, "\n")
}

func (m model) viewCoexistReady() string {
	return strings.Join([]string{
		greenText.Render("Coexist — Disk ready"), "",
		m.disks[m.diskIdx].Path + " is prepared with ESP, ROOT slots and shared HOME.",
		"No distribution has been installed yet.", "",
		m.coexistActionRow(m.coexistReadyChoice == 0, "Install the current live distribution now"),
		m.coexistActionRow(m.coexistReadyChoice == 1, "Exit"),
	}, "\n")
}

func (m model) updateCoexistReady(key string) (tea.Model, tea.Cmd) {
	switch key {
	case "up", "down", "left", "right", "tab", "shift+tab":
		m.coexistReadyChoice = 1 - m.coexistReadyChoice
	case "esc":
		return m, tea.Quit
	case "enter":
		if m.coexistReadyChoice == 1 {
			return m, tea.Quit
		}
		// Keep the verified partitions selected, but require the usual
		// installation settings and summary confirmation before writing.
		m.coexistStage, m.diskField = coexistInstall, 0
	}
	return m, nil
}
