package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"coa/pkg/distro"
	"coa/pkg/parser"
	"coa/pkg/utils"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/spf13/cobra"
)

const (
	customYAMLPath    = "/etc/penguins-eggs.d/custom.yaml"
	customExcludePath = "/etc/penguins-eggs.d/custom.exclude.list"
)

const (
	tabSettings = iota
	tabExcludes
	tabSave
	tabCount
)

const (
	cfgUser = iota
	cfgPassword
	cfgAlgorithm
	cfgLevel
	cfgISOPrefix
	cfgInstaller
	cfgFieldCount
)

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

type configModel struct {
	tab       int
	termWidth int

	focus   int
	inputs  []textinput.Model
	algoIdx int
	instIdx int // 0 for krill, 1 for calamares

	saveFocus int
	saveErr   string

	saved    bool
	quitting bool
}

type configState struct {
	User      string
	Password  string
	Algorithm string
	Level     int
	ISOPrefix string
	Installer string
}

func loadConfigState() configState {
	state := configState{
		User:      "live",
		Password:  "evolution",
		Algorithm: "zstd",
		Level:     3,
		Installer: "krill",
	}
	settings, err := parser.LoadCustomSettings()
	if err != nil || settings == nil {
		return state
	}
	if settings.Remaster.User != "" {
		state.User = settings.Remaster.User
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
	if settings.Remaster.Installer != "" {
		state.Installer = settings.Remaster.Installer
	}
	return state
}

func cfgInputIdx(field int) int {
	switch field {
	case cfgUser:
		return 0
	case cfgPassword:
		return 1
	case cfgLevel:
		return 2
	case cfgISOPrefix:
		return 3
	}
	return -1
}

func newConfigModel() configModel {
	state := loadConfigState()

	inputs := make([]textinput.Model, 4)
	for i := range inputs {
		inputs[i] = textinput.New()
		inputs[i].Prompt = ""
		inputs[i].CharLimit = 64
		inputs[i].Width = 30
	}
	inputs[0].SetValue(state.User)
	inputs[0].Focus()
	inputs[1].SetValue(state.Password)
	inputs[2].SetValue(strconv.Itoa(state.Level))
	inputs[3].SetValue(state.ISOPrefix)

	algoIdx := 0
	for i, a := range cfgAlgorithms {
		if a == state.Algorithm {
			algoIdx = i
			break
		}
	}

	instIdx := 0
	if state.Installer == "calamares" {
		instIdx = 1
	}

	return configModel{
		inputs:  inputs,
		algoIdx: algoIdx,
		instIdx: instIdx,
	}
}

func (m configModel) Init() tea.Cmd {
	return textinput.Blink
}

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

func (m *configModel) focusField(idx int, direction int) tea.Cmd {
	m.focus = (idx + cfgFieldCount) % cfgFieldCount
	for {
		if m.focus == cfgLevel && !m.showLevel() {
			m.focus = (m.focus + direction + cfgFieldCount) % cfgFieldCount
			continue
		}
		if m.focus == cfgInstaller && !isDesktopConfig() {
			m.focus = (m.focus + direction + cfgFieldCount) % cfgFieldCount
			continue
		}
		break
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
		return m, m.focusField(m.focus-1, -1)
	case "down":
		return m, m.focusField(m.focus+1, 1)
	case "left", "right":
		if m.focus == cfgAlgorithm {
			delta := 1
			if key == "left" {
				delta = -1
			}
			m.algoIdx = (m.algoIdx + delta + len(cfgAlgorithms)) % len(cfgAlgorithms)
			return m, nil
		}
		if m.focus == cfgInstaller {
			m.instIdx = 1 - m.instIdx
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
			if state.Installer == "calamares" {
				d := distro.NewDistro()
				pkgs := getCalamaresPackages(d.FamilyID)

				// 1. Check if packages are installable
				if err := checkPackagesInstallable(pkgs, d.FamilyID); err != nil {
					m.saveErr = fmt.Sprintf("Calamares not installable:\n%v", err)
					return m, nil
				}

				// 2. Install the packages
				if err := installPackages(pkgs, d.FamilyID); err != nil {
					m.saveErr = fmt.Sprintf("Calamares install failed:\n%v", err)
					return m, nil
				}
			}

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
		level, _ = strconv.Atoi(m.inputs[2].Value())
		if level <= 0 {
			level = 3
		}
	}
	installers := []string{"krill", "calamares"}
	user := strings.TrimSpace(m.inputs[0].Value())
	if user == "" {
		user = "live"
	}
	return configState{
		User:      user,
		Password:  m.inputs[1].Value(),
		Algorithm: cfgAlgorithms[m.algoIdx],
		Level:     level,
		ISOPrefix: strings.TrimSpace(m.inputs[3].Value()),
		Installer: installers[m.instIdx],
	}
}

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

	type fieldDef struct {
		id    int
		label string
	}
	fields := []fieldDef{
		{cfgUser, "User"},
		{cfgPassword, "Password"},
		{cfgAlgorithm, "Algorithm"},
	}
	if m.showLevel() {
		fields = append(fields, fieldDef{cfgLevel, "Level"})
	}
	fields = append(fields, fieldDef{cfgISOPrefix, "ISO prefix"})
	if isDesktopConfig() {
		fields = append(fields, fieldDef{cfgInstaller, "Installer"})
	}

	var rows []string
	for _, f := range fields {
		marker := "  "
		if m.focus == f.id {
			marker = cfgCyan.Render("→ ")
		}

		var val string
		switch f.id {
		case cfgUser:
			val = m.inputs[0].View()
		case cfgPassword:
			val = m.inputs[1].View()
		case cfgAlgorithm:
			val = cfgCyan.Render("‹ " + cfgAlgorithms[m.algoIdx] + " ›")
		case cfgLevel:
			val = m.inputs[2].View()
		case cfgISOPrefix:
			if m.inputs[3].Value() == "" && m.focus != cfgISOPrefix {
				val = cfgDim.Render("(auto)")
			} else {
				val = m.inputs[3].View()
			}
		case cfgInstaller:
			installers := []string{"krill", "calamares"}
			val = cfgCyan.Render("‹ " + installers[m.instIdx] + " ›")
		}
		rows = append(rows, fmt.Sprintf("%s%-14s: %s", marker, f.label, val))
	}

	help := "\n↑/↓ move · ←/→ change settings · type to edit"
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

func saveConfigState(state configState) error {
	var b strings.Builder
	b.WriteString("# custom.yaml - penguins-eggs configuration overrides\n")
	b.WriteString("remaster:\n")
	if state.User != "" && state.User != "live" {
		b.WriteString(fmt.Sprintf("  user: \"%s\"\n", state.User))
	}
	b.WriteString(fmt.Sprintf("  password: \"%s\"\n", state.Password))
	b.WriteString("  compression:\n")
	b.WriteString(fmt.Sprintf("    algorithm: \"%s\"\n", state.Algorithm))
	if state.Level > 0 {
		b.WriteString(fmt.Sprintf("    level: %d\n", state.Level))
	}
	if state.ISOPrefix != "" {
		b.WriteString(fmt.Sprintf("  iso_prefix: \"%s\"\n", state.ISOPrefix))
	}
	if state.Installer != "" {
		b.WriteString(fmt.Sprintf("  installer: \"%s\"\n", state.Installer))
	}

	if err := os.MkdirAll("/etc/penguins-eggs.d", 0755); err != nil {
		return err
	}
	return os.WriteFile(customYAMLPath, []byte(b.String()), 0644)
}

func isDesktopConfig() bool {
	if files, _ := filepath.Glob("/usr/share/xsessions/*.desktop"); len(files) > 0 {
		return true
	}
	if files, _ := filepath.Glob("/usr/share/wayland-sessions/*.desktop"); len(files) > 0 {
		return true
	}
	return false
}

func getCalamaresPackages(family string) []string {
	switch family {
	case "debian":
		return []string{"calamares", "qml-module-qtquick2", "qml-module-qtquick-controls", "qml-module-qtquick-controls2", "qml-module-qtquick-layouts", "qml-module-qtgraphicaleffects"}
	case "archlinux", "manjaro":
		return []string{"calamares", "qt5-graphicaleffects"}
	case "fedora":
		return []string{"calamares", "qt5-qtgraphicaleffects", "qt5-qtquickcontrols", "qt5-qtquickcontrols2"}
	case "alpine":
		return []string{"calamares", "qt5-qtgraphicaleffects", "qt5-qtquickcontrols", "qt5-qtquickcontrols2"}
	case "opensuse":
		return []string{"calamares", "libqt5-qtgraphicaleffects", "libqt5-qtquickcontrols", "libqt5-qtquickcontrols2"}
	default:
		return []string{"calamares"}
	}
}

func checkPackagesInstallable(packages []string, family string) error {
	var cmd string
	pkgString := strings.Join(packages, " ")
	switch family {
	case "debian":
		cmd = fmt.Sprintf("DEBIAN_FRONTEND=noninteractive apt-get install -y -s %s", pkgString)
	case "archlinux", "manjaro":
		cmd = fmt.Sprintf("pacman -Sp %s", pkgString)
	case "fedora":
		cmd = fmt.Sprintf("dnf install -y --assumeno %s", pkgString)
	case "alpine":
		cmd = fmt.Sprintf("apk add --simulate %s", pkgString)
	case "opensuse":
		cmd = fmt.Sprintf("zypper --non-interactive install --dry-run %s", pkgString)
	default:
		return fmt.Errorf("unsupported distro family for package check: %s", family)
	}

	output, err := utils.ExecCapture(cmd)
	if err != nil {
		return fmt.Errorf("package check failed: %w\nOutput: %s", err, output)
	}
	return nil
}

func installPackages(packages []string, family string) error {
	var cmd string
	pkgString := strings.Join(packages, " ")
	switch family {
	case "debian":
		cmd = fmt.Sprintf("DEBIAN_FRONTEND=noninteractive apt-get install -y %s", pkgString)
	case "archlinux", "manjaro":
		cmd = fmt.Sprintf("pacman -S --noconfirm %s", pkgString)
	case "fedora":
		cmd = fmt.Sprintf("dnf install -y %s", pkgString)
	case "alpine":
		cmd = fmt.Sprintf("apk add %s", pkgString)
	case "opensuse":
		cmd = fmt.Sprintf("zypper --non-interactive install -y %s", pkgString)
	default:
		return fmt.Errorf("unsupported distro family for package install: %s", family)
	}

	err := utils.Exec(cmd)
	if err != nil {
		return fmt.Errorf("package installation failed: %w", err)
	}
	return nil
}

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "View and edit penguins-eggs configuration",
	Long: `The 'config' command provides an interactive TUI to view and modify
the penguins-eggs configuration stored in /etc/penguins-eggs.d/custom.yaml.

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
