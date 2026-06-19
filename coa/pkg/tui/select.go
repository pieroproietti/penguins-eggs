package tui

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	selectCursor   = lipgloss.NewStyle().Foreground(lipgloss.Color("6"))
	selectDim      = lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
	selectSelected = lipgloss.NewStyle().Foreground(lipgloss.Color("6")).Bold(true)
)

type SelectOption struct {
	Label string
	Value string
}

type selectModel struct {
	title    string
	options  []SelectOption
	cursor   int
	chosen   bool
	quitting bool
}

func (m selectModel) Init() tea.Cmd { return nil }

func (m selectModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			m.quitting = true
			return m, tea.Quit
		case "up", "k":
			if m.cursor > 0 {
				m.cursor--
			}
		case "down", "j":
			if m.cursor < len(m.options)-1 {
				m.cursor++
			}
		case "enter":
			m.chosen = true
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m selectModel) View() string {
	if m.chosen || m.quitting {
		return ""
	}

	var b strings.Builder
	b.WriteString(selectCursor.Render(m.title) + "\n\n")

	for i, opt := range m.options {
		cursor := "  "
		style := selectDim
		if i == m.cursor {
			cursor = selectCursor.Render("> ")
			style = selectSelected
		}
		b.WriteString(fmt.Sprintf("%s%s\n", cursor, style.Render(opt.Label)))
	}

	b.WriteString(selectDim.Render("\n↑/↓ select · enter confirm"))
	return b.String()
}

func RunSelect(title string, options []SelectOption, defaultIdx int) (string, error) {
	m := selectModel{
		title:   title,
		options: options,
		cursor:  defaultIdx,
	}

	p := tea.NewProgram(m)
	final, err := p.Run()
	if err != nil {
		return options[defaultIdx].Value, err
	}

	fm := final.(selectModel)
	if fm.quitting {
		return options[defaultIdx].Value, fmt.Errorf("cancelled by user")
	}
	return fm.options[fm.cursor].Value, nil
}
