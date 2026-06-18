package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"coa/pkg/parser"
	"coa/pkg/tui"

	"gopkg.in/yaml.v3"
)

const customPath = "/etc/oa-tools.d/custom.yaml"

var algorithms = []string{"zstd", "xz", "lz4", "gzip"}

var levelRanges = map[string][2]int{
	"zstd": {1, 19},
	"xz":   {0, 9},
	"lz4":  {1, 12},
	"gzip": {1, 9},
}

func load() (*parser.Settings, error) {
	data, err := os.ReadFile(customPath)
	if err != nil {
		if os.IsNotExist(err) {
			return &parser.Settings{
				Remaster: parser.RemasterConfig{
					Compression: parser.CompressionConfig{
						Algorithm: "zstd",
						Level:     3,
					},
				},
			}, nil
		}
		return nil, err
	}

	var settings parser.Settings
	if err := yaml.Unmarshal(data, &settings); err != nil {
		return nil, fmt.Errorf("errore parsing %s: %w", customPath, err)
	}

	if settings.Remaster.Compression.Algorithm == "" {
		settings.Remaster.Compression.Algorithm = "zstd"
	}
	if settings.Remaster.Compression.Level == 0 {
		settings.Remaster.Compression.Level = 3
	}

	return &settings, nil
}

func save(settings *parser.Settings) error {
	var b strings.Builder
	b.WriteString("# custom.yaml - Custom configurations for oa-tools\n")
	b.WriteString("# Override the embedded default settings here.\n\n")
	b.WriteString("remaster:\n")

	if settings.Remaster.Password != "" {
		b.WriteString(fmt.Sprintf("  password: \"%s\"\n", settings.Remaster.Password))
	}

	b.WriteString("  compression:\n")
	b.WriteString(fmt.Sprintf("    algorithm: \"%s\"\n", settings.Remaster.Compression.Algorithm))
	b.WriteString(fmt.Sprintf("    level: %d\n", settings.Remaster.Compression.Level))

	return os.WriteFile(customPath, []byte(b.String()), 0644)
}

func Run() error {
	settings, err := load()
	if err != nil {
		return err
	}

	fmt.Printf("\n  Configurazione attuale (%s):\n", customPath)
	fmt.Printf("    Password live:  %s\n", displayPassword(settings.Remaster.Password))
	fmt.Printf("    Compressione:   %s (livello %d)\n\n",
		settings.Remaster.Compression.Algorithm,
		settings.Remaster.Compression.Level)

	action, err := tui.RunSelect("Cosa vuoi modificare?", []tui.SelectOption{
		{Label: "Algoritmo di compressione", Value: "algorithm"},
		{Label: "Livello di compressione", Value: "level"},
		{Label: "Password sessione live", Value: "password"},
		{Label: "Esci senza modifiche", Value: "quit"},
	}, 0)
	if err != nil || action == "quit" {
		return nil
	}

	switch action {
	case "algorithm":
		err = editAlgorithm(settings)
	case "level":
		err = editLevel(settings)
	case "password":
		err = editPassword(settings)
	}
	if err != nil {
		return err
	}

	if err := save(settings); err != nil {
		return fmt.Errorf("impossibile salvare %s: %w", customPath, err)
	}

	fmt.Printf("\n  Configurazione salvata in %s\n", customPath)
	return nil
}

func editAlgorithm(s *parser.Settings) error {
	options := make([]tui.SelectOption, len(algorithms))
	currentIdx := 0
	for i, alg := range algorithms {
		lr := levelRanges[alg]
		options[i] = tui.SelectOption{
			Label: fmt.Sprintf("%s (livello %d-%d)", alg, lr[0], lr[1]),
			Value: alg,
		}
		if alg == s.Remaster.Compression.Algorithm {
			currentIdx = i
		}
	}

	val, err := tui.RunSelect("Algoritmo di compressione:", options, currentIdx)
	if err != nil {
		return nil
	}

	s.Remaster.Compression.Algorithm = val

	lr := levelRanges[val]
	if s.Remaster.Compression.Level < lr[0] || s.Remaster.Compression.Level > lr[1] {
		s.Remaster.Compression.Level = lr[0]
	}

	return nil
}

func editLevel(s *parser.Settings) error {
	alg := s.Remaster.Compression.Algorithm
	lr := levelRanges[alg]

	var options []tui.SelectOption
	currentIdx := 0
	for i := lr[0]; i <= lr[1]; i++ {
		label := strconv.Itoa(i)
		if i == lr[0] {
			label += " (più veloce)"
		} else if i == lr[1] {
			label += " (più compresso)"
		}
		options = append(options, tui.SelectOption{Label: label, Value: strconv.Itoa(i)})
		if i == s.Remaster.Compression.Level {
			currentIdx = len(options) - 1
		}
	}

	val, err := tui.RunSelect(
		fmt.Sprintf("Livello di compressione per %s (%d-%d):", alg, lr[0], lr[1]),
		options, currentIdx)
	if err != nil {
		return nil
	}

	s.Remaster.Compression.Level, _ = strconv.Atoi(val)
	return nil
}

func editPassword(s *parser.Settings) error {
	if s.Remaster.Password != "" {
		keep := tui.RunConfirmDefault(
			fmt.Sprintf("Password attuale: %s — Vuoi cambiarla?", displayPassword(s.Remaster.Password)))
		if !keep {
			return nil
		}
	}

	pass, err := tui.RunPassword("Nuova password per la sessione live")
	if err != nil {
		return nil
	}

	s.Remaster.Password = pass
	return nil
}

func displayPassword(p string) string {
	if p == "" {
		return "(default: evolution)"
	}
	return p
}
