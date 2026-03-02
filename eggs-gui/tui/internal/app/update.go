package app

import (
	tea "charm.land/bubbletea/v2"
)

// Messages for the Bubble Tea update loop.

// OutputMsg carries a line of command output.
type OutputMsg struct {
	Line string
}

// CommandDoneMsg signals a command has finished.
type CommandDoneMsg struct {
	ExitCode int
	Err      error
}

// VersionsMsg carries version information from the daemon.
type VersionsMsg struct {
	Eggs      string
	Calamares string
	Distro    string
}

// DepsCheckMsg carries dependency check results.
type DepsCheckMsg struct {
	EggsInstalled bool
	ConfigExists  bool
}

// WardrobeMsg carries wardrobe listing results.
type WardrobeMsg struct {
	Costumes    []string
	Accessories []string
	Servers     []string
}

// ErrorMsg carries an error.
type ErrorMsg struct {
	Err error
}

// Update handles messages and updates the model.
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.KeyPressMsg:
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit

		// Tab navigation
		case "1":
			m.ActiveTab = TabMain
		case "2":
			m.ActiveTab = TabWardrobe
		case "3":
			m.ActiveTab = TabConfig
		case "4":
			m.ActiveTab = TabTools

		// Phase 1 toggles
		case "m":
			if m.ActiveTab == TabMain && !m.Running {
				if m.PrepMode == PrepManual {
					m.PrepMode = PrepAuto
				} else {
					m.PrepMode = PrepManual
				}
			}

		// Phase 2 toggles
		case "c":
			if m.ActiveTab == TabMain && !m.Running {
				m.CloneDesktop = !m.CloneDesktop
			}
		case "p":
			if m.ActiveTab == TabMain && !m.Running {
				m.CustomizeISO = !m.CustomizeISO
			}

		// Phase 3 toggles
		case "d":
			if m.ActiveTab == TabMain && !m.Running {
				m.IncludeData = !m.IncludeData
			}
		case "x":
			if m.ActiveTab == TabMain && !m.Running {
				m.MaxCompression = !m.MaxCompression
			}

		// Actions
		case "enter":
			if m.ActiveTab == TabMain && !m.Running {
				// Would trigger command execution via daemon
				m.Running = true
				m.Phase = "Preparing..."
			}

		case "k":
			if m.ActiveTab == TabMain && !m.Running {
				m.Running = true
				m.Phase = "Killing ISOs..."
			}
		}

	case tea.WindowSizeMsg:
		m.Width = msg.Width
		m.Height = msg.Height

	case OutputMsg:
		m.AppendOutput(msg.Line)

	case CommandDoneMsg:
		m.Running = false
		m.Phase = ""
		m.Progress = 0
		if msg.Err != nil {
			m.Err = msg.Err
		}

	case VersionsMsg:
		m.EggsVersion = msg.Eggs
		m.CalamaresVersion = msg.Calamares
		m.DistroInfo = msg.Distro

	case DepsCheckMsg:
		m.DepsOK = msg.EggsInstalled && msg.ConfigExists

	case WardrobeMsg:
		m.Costumes = msg.Costumes
		m.Accessories = msg.Accessories
		m.Servers = msg.Servers

	case ErrorMsg:
		m.Err = msg.Err
	}

	return m, nil
}
