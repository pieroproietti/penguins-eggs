package app

import (
	"fmt"

	tea "charm.land/bubbletea/v2"
	"github.com/eggs-gui/tui/internal/client" // for getDaemon / daemonClient
)

// daemonClient is the package-level persistent connection to eggs-daemon.
// Bubbletea uses value receivers so we cannot cache it on the model directly.
var daemonClient *client.Client

// outputCh carries streamed lines from the daemon goroutine to the TUI.
// A nil value signals the stream is done; an OutputMsg wraps each line.
// Closed and recreated for each command invocation.
var outputCh chan tea.Msg

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

// waitForOutput is a tea.Cmd that blocks until the next message arrives on
// outputCh, then returns it. Update() re-issues this cmd after each OutputMsg
// so the TUI re-renders every line as it arrives.
func waitForOutput() tea.Msg {
	return <-outputCh
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
		// Re-issue waitForOutput so the next line triggers another render.
		return m, waitForOutput

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

// cmdProduce launches eggs.produce on the daemon and returns two cmds:
//   - a goroutine that feeds each output line into outputCh as OutputMsg,
//     then sends CommandDoneMsg when the command finishes
//   - waitForOutput, which reads the first message from outputCh
//
// Update() re-issues waitForOutput after every OutputMsg, so each line
// triggers a re-render as it arrives.
func (m Model) cmdProduce() tea.Cmd {
	opts := buildProduceOpts(m)

	// Fresh buffered channel for this invocation.
	outputCh = make(chan tea.Msg, 64)

	// Goroutine: calls the daemon and feeds outputCh.
	startCmd := func() tea.Msg {
		c, err := getDaemon()
		if err != nil {
			outputCh <- CommandDoneMsg{ExitCode: 1, Err: err}
			return nil // waitForOutput will pick up the done msg
		}

		_, err = c.CallStream("eggs.produce", opts, func(line string) {
			outputCh <- OutputMsg{Line: line}
		})
		if err != nil {
			outputCh <- CommandDoneMsg{ExitCode: 1, Err: err}
		} else {
			outputCh <- CommandDoneMsg{ExitCode: 0}
		}
		return nil
	}

	// Run the goroutine and immediately start draining the channel.
	return tea.Batch(startCmd, waitForOutput)
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
