package main

import (
	"fmt"
	"os"

	tea "charm.land/bubbletea/v2"
	"github.com/eggs-gui/tui/internal/app"
)

func main() {
	m := app.NewModel()
	p := tea.NewProgram(m, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}
