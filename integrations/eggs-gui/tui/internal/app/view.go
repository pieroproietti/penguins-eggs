package app

import (
	"fmt"
	"strings"

	tea "charm.land/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
)

var (
	// Colors matching eggsmaker's dark theme
	colorBg      = lipgloss.Color("#051226")
	colorPanel   = lipgloss.Color("#001835")
	colorButton  = lipgloss.Color("#0E48C5")
	colorOrange  = lipgloss.Color("#FD8637")
	colorBlue    = lipgloss.Color("#00BFFF")
	colorGreen   = lipgloss.Color("#39ee39")
	colorRed     = lipgloss.Color("#ff052b")
	colorCyan    = lipgloss.Color("#56efef")
	colorWhite   = lipgloss.Color("#ffffff")
	colorDimWhite = lipgloss.Color("#888888")

	// Styles
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(colorBlue).
			Padding(0, 1)

	tabStyle = lipgloss.NewStyle().
			Foreground(colorDimWhite).
			Padding(0, 2)

	activeTabStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(colorOrange).
			Padding(0, 2).
			Underline(true)

	panelStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("#444C5E")).
			Padding(1, 2)

	switchOnStyle = lipgloss.NewStyle().
			Foreground(colorGreen).
			Bold(true)

	switchOffStyle = lipgloss.NewStyle().
			Foreground(colorDimWhite)

	statusStyle = lipgloss.NewStyle().
			Foreground(colorOrange).
			Bold(true)

	outputStyle = lipgloss.NewStyle().
			Foreground(colorCyan)

	versionStyle = lipgloss.NewStyle().
			Foreground(colorWhite).
			Bold(true)

	helpStyle = lipgloss.NewStyle().
			Foreground(colorDimWhite)
)

// Init returns the initial command.
func (m Model) Init() tea.Cmd {
	return nil
}

// View renders the TUI.
func (m Model) View() tea.View {
	var s strings.Builder

	// Header
	s.WriteString(titleStyle.Render("🥚 eggs-gui") + "  ")
	s.WriteString(renderTabs(m.ActiveTab))
	s.WriteString("\n\n")

	switch m.ActiveTab {
	case TabMain:
		s.WriteString(m.viewMain())
	case TabWardrobe:
		s.WriteString(m.viewWardrobe())
	case TabConfig:
		s.WriteString(m.viewConfig())
	case TabTools:
		s.WriteString(m.viewTools())
	}

	// Output terminal
	s.WriteString("\n")
	s.WriteString(m.viewOutput())

	// Version bar
	s.WriteString("\n")
	s.WriteString(m.viewVersions())

	// Help
	s.WriteString("\n")
	s.WriteString(helpStyle.Render("  [1-4] tabs  [enter] run  [k] kill  [q] quit"))

	return tea.NewView(s.String())
}

func renderTabs(active Tab) string {
	tabs := []struct {
		name string
		tab  Tab
	}{
		{"[1] Main", TabMain},
		{"[2] Wardrobe", TabWardrobe},
		{"[3] Config", TabConfig},
		{"[4] Tools", TabTools},
	}

	var parts []string
	for _, t := range tabs {
		if t.tab == active {
			parts = append(parts, activeTabStyle.Render(t.name))
		} else {
			parts = append(parts, tabStyle.Render(t.name))
		}
	}
	return strings.Join(parts, "")
}

func (m Model) viewMain() string {
	var s strings.Builder

	// Phase 1
	phase1 := panelStyle.Render(
		titleStyle.Render("Phase 1: Prepare") + "\n\n" +
			renderSwitch("Mode", m.PrepMode == PrepAuto, "AUTO", "Manual", "m") + "\n" +
			renderSwitch("Update Eggs", m.UpdateEggs, "ON", "OFF", "u"),
	)

	// Phase 2
	phase2 := panelStyle.Render(
		titleStyle.Render("Phase 2: Configure") + "\n\n" +
			renderSwitch("Clone Desktop", m.CloneDesktop, "ON", "OFF", "c") + "\n" +
			renderSwitch("Customize ISO", m.CustomizeISO, "ON", "OFF", "p"),
	)

	// Phase 3
	phase3 := panelStyle.Render(
		titleStyle.Render("Phase 3: Produce") + "\n\n" +
			renderSwitch("Include Data", m.IncludeData, "ON", "OFF", "d") + "\n" +
			renderSwitch("Max Compress", m.MaxCompression, "ON", "OFF", "x"),
	)

	s.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, phase1, "  ", phase2, "  ", phase3))

	// Status
	if m.Running {
		s.WriteString("\n\n")
		s.WriteString(statusStyle.Render(fmt.Sprintf("  ▶ %s", m.Phase)))
		if m.Progress > 0 {
			s.WriteString(fmt.Sprintf("  %.0f%%", m.Progress))
		}
	}

	return s.String()
}

func (m Model) viewWardrobe() string {
	var s strings.Builder

	costumes := panelStyle.Render(
		titleStyle.Render("Costumes") + "\n\n" +
			renderList(m.Costumes),
	)

	accessories := panelStyle.Render(
		titleStyle.Render("Accessories") + "\n\n" +
			renderList(m.Accessories),
	)

	servers := panelStyle.Render(
		titleStyle.Render("Servers") + "\n\n" +
			renderList(m.Servers),
	)

	s.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, costumes, "  ", accessories, "  ", servers))
	return s.String()
}

func (m Model) viewConfig() string {
	return panelStyle.Render(
		titleStyle.Render("eggs.yaml Configuration") + "\n\n" +
			"  Press [e] to edit configuration\n" +
			"  Press [r] to reload from disk",
	)
}

func (m Model) viewTools() string {
	var s strings.Builder

	tools := []struct {
		key  string
		name string
	}{
		{"c", "Clean"},
		{"a", "PPA Add"},
		{"r", "PPA Remove"},
		{"s", "Skel"},
		{"y", "Yolk"},
		{"i", "Calamares Install"},
		{"d", "Calamares Remove"},
	}

	content := titleStyle.Render("Tools") + "\n\n"
	for _, t := range tools {
		content += fmt.Sprintf("  [%s] %s\n", t.key, t.name)
	}

	s.WriteString(panelStyle.Render(content))
	return s.String()
}

func (m Model) viewOutput() string {
	lines := m.OutputLines
	maxVisible := 8
	if len(lines) > maxVisible {
		lines = lines[len(lines)-maxVisible:]
	}

	content := ""
	for _, line := range lines {
		content += outputStyle.Render("  " + line) + "\n"
	}
	if content == "" {
		content = outputStyle.Render("  Ready.") + "\n"
	}

	return panelStyle.Render(
		titleStyle.Render("Output") + "\n" + content,
	)
}

func (m Model) viewVersions() string {
	eggs := "N/A"
	if m.EggsVersion != "" {
		eggs = m.EggsVersion
	}
	cal := "N/A"
	if m.CalamaresVersion != "" {
		cal = m.CalamaresVersion
	}
	distro := ""
	if m.DistroInfo != "" {
		distro = m.DistroInfo
	}

	return versionStyle.Render(fmt.Sprintf(
		"  Eggs: %s  |  Calamares: %s  |  %s  |  eggs-gui v1.0.0",
		eggs, cal, distro,
	))
}

func renderSwitch(label string, on bool, onText, offText, key string) string {
	indicator := "○"
	text := offText
	style := switchOffStyle
	if on {
		indicator = "●"
		text = onText
		style = switchOnStyle
	}
	return fmt.Sprintf("  [%s] %s %s", key, style.Render(indicator+" "+text), helpStyle.Render(label))
}

func renderList(items []string) string {
	if len(items) == 0 {
		return "  (none)\n"
	}
	var s strings.Builder
	for _, item := range items {
		s.WriteString("  • " + item + "\n")
	}
	return s.String()
}
