package tui

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	pwLabel = lipgloss.NewStyle().Foreground(lipgloss.Color("6"))
	pwError = lipgloss.NewStyle().Foreground(lipgloss.Color("1"))
	pwDim   = lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
)

type passwordModel struct {
	title    string
	inputs   [2]textinput.Model
	focused  int
	err      string
	done     bool
	quitting bool
}

func newPasswordModel(title string) passwordModel {
	pass := textinput.New()
	pass.Placeholder = "password"
	pass.EchoMode = textinput.EchoPassword
	pass.Focus()

	confirm := textinput.New()
	confirm.Placeholder = "confirm password"
	confirm.EchoMode = textinput.EchoPassword

	return passwordModel{
		title:  title,
		inputs: [2]textinput.Model{pass, confirm},
	}
}

func (m passwordModel) Init() tea.Cmd {
	return textinput.Blink
}

func (m passwordModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			m.quitting = true
			return m, tea.Quit
		case "tab", "down":
			m.err = ""
			m.focused = (m.focused + 1) % 2
			for i := range m.inputs {
				if i == m.focused {
					m.inputs[i].Focus()
				} else {
					m.inputs[i].Blur()
				}
			}
			return m, nil
		case "shift+tab", "up":
			m.err = ""
			m.focused = (m.focused + 1) % 2
			for i := range m.inputs {
				if i == m.focused {
					m.inputs[i].Focus()
				} else {
					m.inputs[i].Blur()
				}
			}
			return m, nil
		case "enter":
			if m.focused == 0 {
				m.focused = 1
				m.inputs[0].Blur()
				m.inputs[1].Focus()
				return m, nil
			}
			p1 := m.inputs[0].Value()
			p2 := m.inputs[1].Value()
			if p1 == "" {
				m.err = "Password cannot be empty."
				return m, nil
			}
			if p1 != p2 {
				m.err = "Passwords do not match."
				m.inputs[1].SetValue("")
				return m, nil
			}
			m.done = true
			return m, tea.Quit
		}
	}

	var cmd tea.Cmd
	m.inputs[m.focused], cmd = m.inputs[m.focused].Update(msg)
	return m, cmd
}

func (m passwordModel) View() string {
	if m.done || m.quitting {
		return ""
	}

	var b strings.Builder
	b.WriteString(pwLabel.Render(m.title) + "\n\n")
	b.WriteString(fmt.Sprintf("  Password: %s\n", m.inputs[0].View()))
	b.WriteString(fmt.Sprintf("  Confirm:  %s\n", m.inputs[1].View()))

	if m.err != "" {
		b.WriteString("\n" + pwError.Render("  "+m.err))
	}
	b.WriteString("\n" + pwDim.Render("  tab switch field · enter confirm"))
	return b.String()
}

func RunPassword(title string) (string, error) {
	m := newPasswordModel(title)

	p := tea.NewProgram(m)
	final, err := p.Run()
	if err != nil {
		return "", err
	}

	fm := final.(passwordModel)
	if fm.quitting {
		return "", fmt.Errorf("cancelled by user")
	}
	return fm.inputs[0].Value(), nil
}
