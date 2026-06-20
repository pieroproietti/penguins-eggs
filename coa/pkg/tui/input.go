package tui

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	inputLabel = lipgloss.NewStyle().Foreground(lipgloss.Color("6"))
	inputDim   = lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
)

type inputModel struct {
	title    string
	input    textinput.Model
	done     bool
	quitting bool
}

func (m inputModel) Init() tea.Cmd { return textinput.Blink }

func (m inputModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "esc":
			m.quitting = true
			return m, tea.Quit
		case "enter":
			m.done = true
			return m, tea.Quit
		}
	}
	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)
	return m, cmd
}

func (m inputModel) View() string {
	if m.done || m.quitting {
		return ""
	}
	var b strings.Builder
	b.WriteString(inputLabel.Render(m.title) + "\n\n")
	b.WriteString("  " + m.input.View() + "\n")
	b.WriteString("\n" + inputDim.Render("  enter confirm · esc cancel"))
	return b.String()
}

func RunInput(title, defaultValue string) (string, error) {
	ti := textinput.New()
	ti.SetValue(defaultValue)
	ti.Focus()

	m := inputModel{title: title, input: ti}
	p := tea.NewProgram(m)
	final, err := p.Run()
	if err != nil {
		return defaultValue, err
	}

	fm := final.(inputModel)
	if fm.quitting {
		return defaultValue, fmt.Errorf("cancelled by user")
	}
	return fm.input.Value(), nil
}
