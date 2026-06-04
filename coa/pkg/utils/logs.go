// Copyright 2026 Piero Proietti <piero.proietti@gmail.com>.
// All rights reserved.

package utils

import (
	"fmt"
	"os"
)

// Colori ANSI
const (
	ColorBlue   = "\033[1;34m"
	ColorCyan   = "\033[36m"
	ColorGreen  = "\033[1;32m"
	ColorRed    = "\033[1;31m"
	ColorReset  = "\033[0m"
	ColorYellow = "\033[33m"
)

// DisableColors permette di disattivare i colori.
// Può essere forzata a 'true' manualmente nel codice (es. durante la creazione del plan).
var DisableColors bool

func init() {
	// Auto-rilevamento: se os.Stdout NON è un terminale (es. rediretto in un file log o pipe),
	// spegne i colori in automatico per evitare caratteri ANSI sporchi nel testo.
	stat, _ := os.Stdout.Stat()
	if (stat.Mode() & os.ModeCharDevice) == 0 {
		DisableColors = true
	}
}

// colorize restituisce il codice ANSI solo se i colori sono abilitati,
// altrimenti restituisce una stringa vuota, mantenendo il log pulito.
func colorize(colorCode string) string {
	if DisableColors {
		return ""
	}
	return colorCode
}

// --- SISTEMA DI LOGGING CENTRALIZZATO ---

// LogNormal stampa un messaggio informativo con il tag [coa]
func LogNormal(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	fmt.Printf("%s[coa]%s %s\n", colorize(ColorCyan), colorize(ColorReset), msg)
}

// LogSuccess stampa un messaggio di successo
func LogSuccess(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	fmt.Printf("%s[coa]%s %s\n", colorize(ColorGreen), colorize(ColorReset), msg)
}

// LogWarning stampa un messaggio di avviso
func LogWarning(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	fmt.Printf("%s[WARNING]%s %s\n", colorize(ColorYellow), colorize(ColorReset), msg)
}

// LogError stampa un messaggio di errore sullo STANDARD ERROR
func LogError(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	fmt.Fprintf(os.Stderr, "\n%s[ERRORE]%s %s\n", colorize(ColorRed), colorize(ColorReset), msg)
}

// Fatal stampa un errore ed esce con codice 1
func Fatal(format string, a ...interface{}) {
	LogError(format, a...)
	os.Exit(1)
}
