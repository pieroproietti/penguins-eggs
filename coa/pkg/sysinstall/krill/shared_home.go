package krill

import (
	"fmt"
	"strings"

	"coa/pkg/sysinstall/krill/engine"
	tea "github.com/charmbracelet/bubbletea"
)

func (m model) coexistStorageError() string {
	if m.storageError != "" {
		return m.storageError
	}
	var paths []string
	for _, p := range m.homeParts {
		if engine.IsSharedHomeLabel(p.Label) || engine.IsSharedHomeLabel(p.PartLabel) {
			paths = append(paths, p.Path)
		}
	}
	_, err := engine.UniqueSharedHome(paths)
	if err != nil {
		return err.Error()
	}
	return ""
}

func sharedHomeError(p PartitionInfo) string {
	if err := engine.ValidateSharedHomeFilesystem(p.FsType, p.Label); err != nil {
		return err.Error()
	}
	if p.IsEfi || p.InUse || p.MountPoint != "" || p.ReadOnly {
		return fmt.Sprintf("Shared HOME %s must be unmounted, writable and unused.", p.Path)
	}
	return ""
}

func (m model) selectedHomeError() string {
	if len(m.homeParts) != 1 || m.homeIdx != 0 {
		return "Shared HOME selection changed; select its location again."
	}
	return sharedHomeError(m.homeParts[0])
}

func (m model) sharedHomeDescription() string {
	if m.prepareRootHome {
		return "/home on each ROOT (no shared partition required)"
	}
	if m.homeExternal {
		return m.prepareHome.Path + " (external partition, no formatting)"
	}
	return "Create SHARED_HOMES on Coexist disk, at least 10 GiB"
}

func (m model) viewSharedHome() string {
	a, b := "(•) ", "( ) "
	if !m.prepareRootHome {
		a, b = b, a
	}
	shared := "Create SHARED_HOMES on Coexist disk (at least 10 GiB)"
	if len(m.homeParts) == 1 {
		shared = "Reuse SHARED_HOMES: " + m.homeParts[0].Path + " (on another disk)"
	}
	return strings.Join([]string{
		renderSteps(4), "", "Home location for disk preparation", "",
		a + "On system partition (/home on each ROOT)", "",
		b + shared, "",
		"Default ROOT slots: 10 GiB each; size them for system and user data.",
		m.diskError,
		"↑/↓ select | Enter: continue | Esc: Coexist menu",
	}, "\n")
}

func (m model) updateSharedHome(key string) (tea.Model, tea.Cmd) {
	switch key {
	case "up", "down", "left", "right", "tab", "shift+tab", " ":
		m.prepareRootHome = !m.prepareRootHome
	case "esc":
		m.coexistStage, m.diskField, m.diskError = coexistChoose, 2, ""
	case "enter":
		if err := m.coexistStorageError(); err != "" {
			m.diskError = err
			return m, nil
		}
		m.homeExternal, m.prepareHome = false, PartitionInfo{}
		if !m.prepareRootHome && len(m.homeParts) == 1 {
			if err := sharedHomeError(m.homeParts[0]); err != "" {
				m.diskError = err
				return m, nil
			}
			m.homeExternal, m.prepareHome = true, m.homeParts[0]
		}
		m.coexistStage, m.diskField, m.diskError = coexistPrepare, 0, ""
	}
	return m, nil
}
