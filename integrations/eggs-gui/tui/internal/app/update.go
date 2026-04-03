package app

import (
	"encoding/json"
	"fmt"

	tea "charm.land/bubbletea/v2"
	"github.com/eggs-gui/tui/internal/client"
)

// daemonClient is the package-level persistent connection to eggs-daemon.
// Bubbletea uses value receivers so we cannot cache it on the model directly.
var daemonClient *client.Client

func getDaemon() (*client.Client, error) {
	if daemonClient != nil {
		return daemonClient, nil
	}
	c, err := client.Connect()
	if err != nil {
		return nil, fmt.Errorf("daemon not running — start with: eggs gui --daemon-only: %w", err)
	}
	daemonClient = c
	return c, nil
}

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
				m.Running = true
				m.Phase = "Producing ISO..."
				m.Err = nil
				return m, m.cmdProduce()
			}

		case "k":
			if m.ActiveTab == TabMain && !m.Running {
				m.Running = true
				m.Phase = "Killing ISOs..."
				m.Err = nil
				return m, m.cmdKill()
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

// cmdProduce returns a Bubbletea Cmd that calls eggs.produce on the daemon
// and streams output back as OutputMsg / CommandDoneMsg.
func (m Model) cmdProduce() tea.Cmd {
	opts := buildProduceOpts(m)
	return func() tea.Msg {
		c, err := getDaemon()
		if err != nil {
			return CommandDoneMsg{ExitCode: 1, Err: err}
		}

		c.OnNotification = func(method string, params json.RawMessage) {
			// stream.output notifications are handled inside CallStream
		}

		// CallStream blocks until the command completes, calling onLine for
		// each streamed output line. Full line-by-line streaming to the TUI
		// requires a channel-based approach and is a future enhancement.
		_, err = c.CallStream("eggs.produce", opts, func(line string) { _ = line })
		if err != nil {
			return CommandDoneMsg{ExitCode: 1, Err: err}
		}
		return CommandDoneMsg{ExitCode: 0}
	}
}

// cmdKill returns a Cmd that calls eggs.kill on the daemon.
func (m Model) cmdKill() tea.Cmd {
	return func() tea.Msg {
		c, err := getDaemon()
		if err != nil {
			return CommandDoneMsg{ExitCode: 1, Err: err}
		}
		_, err = c.Call("eggs.kill", nil)
		if err != nil {
			return CommandDoneMsg{ExitCode: 1, Err: err}
		}
		return CommandDoneMsg{ExitCode: 0}
	}
}

// buildProduceOpts maps the TUI model fields to the daemon ProduceOptions struct.
func buildProduceOpts(m Model) map[string]interface{} {
	compression := m.Compression
	if m.MaxCompression {
		compression = "max"
	}
	return map[string]interface{}{
		"prefix":               m.Prefix,
		"basename":             m.Basename,
		"theme":                m.Theme,
		"compression":          compression,
		"clone":                m.Clone,
		"homecrypt":            m.Homecrypt,
		"fullcrypt":            m.Fullcrypt,
		"script":               m.Script,
		"yolk":                 m.Yolk,
		"release":              m.Release,
		"sbom":                 m.Sbom,
		"audit":                m.Audit,
		"audit_format":         m.AuditFormat,
		"audit_output":         m.AuditOutput,
		"audit_vouch_key":      m.AuditVouchKey,
		"audit_hardening":      m.AuditHardening,
		"audit_grant_policy":   m.AuditGrantPolicy,
		"audit_fail_on_deny":   m.AuditFailOnDeny,
		"recovery":             m.Recovery,
		"recovery_gui":         m.RecoveryGui,
		"recovery_rescapp":     m.RecoveryRescapp,
		"distrobuilder":        m.Distrobuilder,
		"distrobuilder_type":   m.DistrobuilderType,
		"distrobuilder_output": m.DistrobuilderOutput,
		"publish_incus":        m.PublishIncus,
		"publish_incus_url":    m.PublishIncusUrl,
		"publish_incus_token":  m.PublishIncusToken,
		"publish_incus_product": m.PublishIncusProduct,
		"snapshot":             m.Snapshot,
		"lfs":                  m.Lfs,
		"ipfs":                 m.Ipfs,
	}
}
