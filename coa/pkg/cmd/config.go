package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"coa/pkg/parser"
	"coa/pkg/utils"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/spf13/cobra"
)

const (
	customYAMLPath    = "/etc/oa-tools.d/custom.yaml"
	customExcludePath = "/etc/oa-tools.d/custom.exclude.list"
)

// --- Tabs ---
const (
	tabSettings = iota
	tabExcludes
	tabSave
	tabCount
)

// --- Settings fields ---
const (
	cfgPassword = iota
	cfgAlgorithm
	cfgLevel
	cfgISOPrefix
	cfgFieldCount
)

// --- Styles (same palette as krill) ---
var (
	cfgTitle  = lipgloss.NewStyle().Foreground(lipgloss.Color("#C59B27")).Bold(true).MarginBottom(1)
	cfgCyan   = lipgloss.NewStyle().Foreground(lipgloss.Color("#00FFFF"))
	cfgGreen  = lipgloss.NewStyle().Foreground(lipgloss.Color("#00FF00"))
	cfgRed    = lipgloss.NewStyle().Foreground(lipgloss.Color("#FF0000"))
	cfgDim    = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
	cfgWindow = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			Height(12).
			Padding(0, 1)
)

var cfgAlgorithms = []string{"zstd", "xz", "lz4", "gzip"}

type editorDoneMsg struct{}

// --- Model ---
type configModel struct {
	tab       int
	termWidth int

	// Settings
	focus   int
	inputs  []textinput.Model // [password, level, isoPrefix]
	algoIdx int

	// Save
	saveFocus int
	saveErr   string

	// State
	saved    bool
	quitting bool
}

type configState struct {
	Password  string
	Algorithm string
	Level     int
	ISOPrefix string
}

func loadConfigState() configState {
	state := configState{
		Password:  "evolution",
		Algorithm: "zstd",
		Level:     3,
	}
	settings, err := parser.LoadCustomSettings()
	if err != nil || settings == nil {
		return state
	}
	if settings.Remaster.Password != "" {
		state.Password = settings.Remaster.Password
	}
	if settings.Remaster.Compression.Algorithm != "" {
		state.Algorithm = settings.Remaster.Compression.Algorithm
	}
	if settings.Remaster.Compression.Level > 0 {
		state.Level = settings.Remaster.Compression.Level
	}
	state.ISOPrefix = settings.Remaster.ISOPrefix
	return state
}

func cfgInputIdx(field int) int {
	switch field {
	case cfgPassword:
		return 0
	case cfgLevel:
		return 1
	case cfgISOPrefix:
		return 2
	}
	return -1
}

func newConfigModel() configModel {
	state := loadConfigState()

	inputs := make([]textinput.Model, 3)
	for i := range inputs {
		inputs[i] = textinput.New()
		inputs[i].Prompt = ""
		inputs[i].CharLimit = 64
		inputs[i].Width = 30
	}
	inputs[0].SetValue(state.Password)
	inputs[0].Focus()
	inputs[1].SetValue(strconv.Itoa(state.Level))
	inputs[2].SetValue(state.ISOPrefix)

	algoIdx := 0
	for i, a := range cfgAlgorithms {
		if a == state.Algorithm {
			algoIdx = i
			break
		}
	}

	return configModel{
		inputs:  inputs,
		algoIdx: algoIdx,
	}
}

// --- Init ---
func (m configModel) Init() tea.Cmd {
	return textinput.Blink
}

// --- Update ---
func (m configModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.termWidth = msg.Width
		return m, nil

	case editorDoneMsg:
		return m, nil

	case tea.KeyMsg:
		key := msg.String()

		if key == "ctrl+c" {
			m.quitting = true
			return m, tea.Quit
		}

		switch key {
		case "tab":
			m.tab = (m.tab + 1) % tabCount
			return m, m.onTabSwitch()
		case "shift+tab":
			m.tab = (m.tab - 1 + tabCount) % tabCount
			return m, m.onTabSwitch()
		}

		switch m.tab {
		case tabSettings:
			return m.updateSettings(msg)
		case tabExcludes:
			return m.updateExcludes(key)
		case tabSave:
			return m.updateSave(key)
		}
	}
	return m, nil
}

func (m *configModel) onTabSwitch() tea.Cmd {
	m.focus = 0
	m.saveFocus = 0
	m.saveErr = ""
	for i := range m.inputs {
		m.inputs[i].Blur()
	}
	if m.tab == tabSettings {
		return m.inputs[0].Focus()
	}
	return nil
}

func (m *configModel) focusField(idx int) tea.Cmd {
	m.focus = (idx + cfgFieldCount) % cfgFieldCount
	if !m.showLevel() && m.focus == cfgLevel {
		if idx < cfgLevel {
			m.focus = cfgISOPrefix
		} else {
			m.focus = cfgAlgorithm
		}
	}
	for i := range m.inputs {
		m.inputs[i].Blur()
	}
	if ii := cfgInputIdx(m.focus); ii >= 0 {
		return m.inputs[ii].Focus()
	}
	return nil
}

func (m configModel) updateSettings(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	key := msg.String()
	switch key {
	case "up":
		return m, m.focusField(m.focus - 1)
	case "down":
		return m, m.focusField(m.focus + 1)
	case "left", "right":
		if m.focus == cfgAlgorithm {
			delta := 1
			if key == "left" {
				delta = -1
			}
			m.algoIdx = (m.algoIdx + delta + len(cfgAlgorithms)) % len(cfgAlgorithms)
			return m, nil
		}
	}

	if ii := cfgInputIdx(m.focus); ii >= 0 {
		var cmd tea.Cmd
		m.inputs[ii], cmd = m.inputs[ii].Update(msg)
		return m, cmd
	}
	return m, nil
}

func (m configModel) updateExcludes(key string) (tea.Model, tea.Cmd) {
	if key == "enter" {
		editor := os.Getenv("EDITOR")
		if editor == "" {
			editor = "nano"
		}
		c := exec.Command(editor, customExcludePath)
		return m, tea.ExecProcess(c, func(err error) tea.Msg {
			return editorDoneMsg{}
		})
	}
	return m, nil
}

func (m configModel) updateSave(key string) (tea.Model, tea.Cmd) {
	switch key {
	case "up", "down":
		m.saveFocus = 1 - m.saveFocus
		m.saveErr = ""
	case "enter":
		if m.saveFocus == 0 {
			state := m.buildState()
			if err := saveConfigState(state); err != nil {
				m.saveErr = fmt.Sprintf("Save failed: %v", err)
				return m, nil
			}
			m.saved = true
		}
		m.quitting = true
		return m, tea.Quit
	}
	return m, nil
}

func (m configModel) buildState() configState {
	level := 0
	if m.showLevel() {
		level, _ = strconv.Atoi(m.inputs[1].Value())
		if level <= 0 {
			level = 3
		}
	}
	return configState{
		Password:  m.inputs[0].Value(),
		Algorithm: cfgAlgorithms[m.algoIdx],
		Level:     level,
		ISOPrefix: strings.TrimSpace(m.inputs[2].Value()),
	}
}

// --- View ---
func (m configModel) View() string {
	if m.saved || m.quitting {
		return ""
	}

	title := cfgTitle.Render("COA CONFIG - PENGUINS-EGGS")

	var content string
	switch m.tab {
	case tabSettings:
		content = m.viewSettings()
	case tabExcludes:
		content = m.viewExcludes()
	case tabSave:
		content = m.viewSave()
	}

	width := m.termWidth - 2
	if width < 60 {
		width = 60
	}
	box := cfgWindow.Width(width).Render(content)
	view := lipgloss.JoinVertical(lipgloss.Center, title, box)

	footer := "\ntab switch section · ctrl+c quit"
	return "\n" + view + "\n" + footer + "\n"
}

func (m configModel) renderTabs() string {
	tabs := []string{"Settings", "Excludes", "Save"}
	var parts []string
	for i, t := range tabs {
		if i == m.tab {
			parts = append(parts, cfgCyan.Render(t))
		} else {
			parts = append(parts, cfgDim.Render(t))
		}
	}
	bar := strings.Join(parts, "   ")
	rule := cfgDim.Render(strings.Repeat("─", lipgloss.Width(bar)))
	return lipgloss.JoinVertical(lipgloss.Left, bar, rule)
}

func (m configModel) showLevel() bool {
	return cfgAlgorithms[m.algoIdx] == "zstd"
}

func (m configModel) viewSettings() string {
	tabs := m.renderTabs()

	userRow := fmt.Sprintf("  %-14s: %s", "User", cfgGreen.Render("live"))

	type fieldDef struct {
		id    int
		label string
	}
	fields := []fieldDef{
		{cfgPassword, "Password"},
		{cfgAlgorithm, "Algorithm"},
	}
	if m.showLevel() {
		fields = append(fields, fieldDef{cfgLevel, "Level"})
	}
	fields = append(fields, fieldDef{cfgISOPrefix, "ISO prefix"})

	var rows []string
	rows = append(rows, userRow)
	for _, f := range fields {
		marker := "  "
		if m.focus == f.id {
			marker = cfgCyan.Render("→ ")
		}

		var val string
		switch f.id {
		case cfgPassword:
			val = m.inputs[0].View()
		case cfgAlgorithm:
			val = cfgCyan.Render("‹ " + cfgAlgorithms[m.algoIdx] + " ›")
		case cfgLevel:
			val = m.inputs[1].View()
		case cfgISOPrefix:
			if m.inputs[2].Value() == "" && m.focus != cfgISOPrefix {
				val = cfgDim.Render("(auto)")
			} else {
				val = m.inputs[2].View()
			}
		}
		rows = append(rows, fmt.Sprintf("%s%-14s: %s", marker, f.label, val))
	}

	help := "\n↑/↓ move · ←/→ change algorithm · type to edit"
	content := lipgloss.JoinVertical(lipgloss.Left, rows...)
	return lipgloss.JoinVertical(lipgloss.Left, tabs, "", content, help)
}

func (m configModel) viewExcludes() string {
	tabs := m.renderTabs()

	lines := []string{
		fmt.Sprintf("File: %s", cfgCyan.Render(customExcludePath)),
		"",
	}

	data, err := os.ReadFile(customExcludePath)
	if err != nil {
		lines = append(lines, cfgDim.Render("(file not found — will be created on first edit)"))
	} else {
		count := 0
		for _, line := range strings.Split(string(data), "\n") {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			lines = append(lines, cfgDim.Render("  "+line))
			count++
			if count >= 6 {
				lines = append(lines, cfgDim.Render("  ..."))
				break
			}
		}
	}

	lines = append(lines, "", "Press enter to open in $EDITOR")

	content := lipgloss.JoinVertical(lipgloss.Left, lines...)
	return lipgloss.JoinVertical(lipgloss.Left, tabs, "", content)
}

func (m configModel) viewSave() string {
	tabs := m.renderTabs()

	options := []string{"Save and exit", "Exit without saving"}
	var rows []string
	for i, opt := range options {
		marker := "  "
		if m.saveFocus == i {
			marker = cfgCyan.Render("→ ")
		}
		rows = append(rows, marker+opt)
	}

	if m.saveErr != "" {
		rows = append(rows, "", cfgRed.Render(m.saveErr))
	}

	help := "\n↑/↓ select · enter confirm"
	content := lipgloss.JoinVertical(lipgloss.Left, rows...)
	return lipgloss.JoinVertical(lipgloss.Left, tabs, "", content, help)
}

// --- Save ---
func saveConfigState(state configState) error {
	var b strings.Builder
	b.WriteString("# custom.yaml - oa-tools configuration overrides\n")
	b.WriteString("remaster:\n")
	b.WriteString(fmt.Sprintf("  password: \"%s\"\n", state.Password))
	b.WriteString("  compression:\n")
	b.WriteString(fmt.Sprintf("    algorithm: \"%s\"\n", state.Algorithm))
	if state.Level > 0 {
		b.WriteString(fmt.Sprintf("    level: %d\n", state.Level))
	}
	if state.ISOPrefix != "" {
		b.WriteString(fmt.Sprintf("  iso_prefix: \"%s\"\n", state.ISOPrefix))
	}

	if err := os.MkdirAll("/etc/oa-tools.d", 0755); err != nil {
		return err
	}
	return os.WriteFile(customYAMLPath, []byte(b.String()), 0644)
}

// --- Cobra ---
var configCmd = &cobra.Command{
	Use:   "config",
	Short: "View and edit oa-tools configuration",
	Long: `The 'config' command provides an interactive TUI to view and modify
the oa-tools configuration stored in /etc/oa-tools.d/custom.yaml.

You can change the live user password, compression settings, ISO naming,
and edit the custom exclude list for squashfs generation.`,
	Example: `  sudo coa config`,
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements(cmd.Name(), true)

		m := newConfigModel()
		p := tea.NewProgram(m, tea.WithAltScreen())
		final, err := p.Run()
		if err != nil {
			utils.Fatal("Error running config: %v", err)
		}
		fm := final.(configModel)
		if fm.saved {
			utils.LogSuccess("Configuration saved to %s", customYAMLPath)
		}
	},
}

func init() {
	rootCmd.AddCommand(configCmd)
}
