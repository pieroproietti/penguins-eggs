package tui

import (
	"fmt"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	confirmHighlight = lipgloss.NewStyle().Foreground(lipgloss.Color("6")).Bold(true)
	confirmDim2      = lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
)

type confirmModel struct {
	title    string
	value    bool
	chosen   bool
	quitting bool
}

func (m confirmModel) Init() tea.Cmd { return nil }

func (m confirmModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			m.quitting = true
			return m, tea.Quit
		case "left", "h", "right", "l", "tab":
			m.value = !m.value
		case "y", "s":
			m.value = true
			m.chosen = true
			return m, tea.Quit
		case "n":
			m.value = false
			m.chosen = true
			return m, tea.Quit
		case "enter":
			m.chosen = true
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m confirmModel) View() string {
	if m.chosen || m.quitting {
		return ""
	}

	yes := confirmDim2.Render("Si")
	no := confirmDim2.Render("No")
	if m.value {
		yes = confirmHighlight.Render("[ Si ]")
	} else {
		no = confirmHighlight.Render("[ No ]")
	}

	return fmt.Sprintf("%s  %s  %s\n%s",
		confirmHighlight.Render(m.title),
		yes, no,
		confirmDim2.Render("←/→ cambia · enter conferma"))
}

func RunConfirm(title string, defaultValue bool) (bool, error) {
	m := confirmModel{
		title: title,
		value: defaultValue,
	}

	p := tea.NewProgram(m)
	final, err := p.Run()
	if err != nil {
		return defaultValue, err
	}

	fm := final.(confirmModel)
	if fm.quitting {
		return defaultValue, fmt.Errorf("annullato dall'utente")
	}
	return fm.value, nil
}

// RunConfirmDefault è un shortcut per conferme dove il default è Si.
func RunConfirmDefault(title string) bool {
	val, err := RunConfirm(title, true)
	if err != nil {
		return true
	}
	return val
}

