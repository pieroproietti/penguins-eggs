// cmd/ell.go
package cmd

import (
	"coa/pkg/worker"
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/spf13/cobra"
)

// ellCmd rappresenta il worker interno "coa ell"
var ellCmd = &cobra.Command{
	Use:    "ell",
	Short:  "Internal worker for oa-ell actions",
	Hidden: true, // Il trucco: non appare in 'coa --help'
	Run: func(cmd *cobra.Command, args []string) {
		// 1. Legge tutto il payload dalla pipe (Standard Input)
		payload, err := io.ReadAll(os.Stdin)
		if err != nil {
			fmt.Fprintf(os.Stderr, "coa ell: errore fatale di lettura da stdin: %v\n", err)
			os.Exit(1)
		}

		if len(payload) == 0 {
			fmt.Fprintln(os.Stderr, "coa ell: ricevuto payload vuoto.")
			os.Exit(1)
		}

		// 2. Lettura "esplorativa" per estrarre il nome E il modulo in anticipo
		var taskBase struct {
			Name   string `json:"name"`
			Module string `json:"module"` // <-- ORA È AL PRIMO LIVELLO!
		}
		if err := json.Unmarshal(payload, &taskBase); err != nil {
			fmt.Fprintf(os.Stderr, "coa ell: errore di parsing JSON base: %v\n", err)
			fmt.Printf("Payload grezzo corrotto:\n%s\n", string(payload))
			os.Exit(1)
		}

		// 3. Calcolo della rotta
		route := taskBase.Module
		if route == "" {
			route = taskBase.Name // Fallback per retrocompatibilità
		}

		// 4. Deleghiamo l'esecuzione al Router
		if err := routeModule(route, taskBase.Name, payload); err != nil {
			// Se un handler restituisce errore, stampiamo e usciamo con 1 per il C
			fmt.Fprintf(os.Stderr, "Fallimento modulo [%s]: %v\n", route, err)
			os.Exit(1)
		}

		// Se arriviamo qui, l'handler ha restituito nil. Successo totale.
		os.Exit(0)
	},
}

func init() {
	rootCmd.AddCommand(ellCmd)
}

// ==============================================================================
// ROUTER E HANDLERS
// ==============================================================================

// routeModule instrada il payload verso la funzione handler corretta
func routeModule(route, name string, payload []byte) error {
	switch route {
	case "autologin-gui":
		return handleAutologin(payload)
	case "copy":
		return handleCopy(payload)
	case "shell":
		return handleShell(payload)
	case "mksquashfs":
		return handleMksquashfs(payload)
	case "template":
		return handleTemplate(payload)
	case "xorriso":
		return handleXorriso(payload) // <-- Aggiunto il router per l'ISO!
	default:
		return fmt.Errorf("Azione '%s' non ancora implementata in oa-ell", name)
	}
}

func handleAutologin(payload []byte) error {
	var config worker.ActionAutologinGui
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON: %w", err)
	}
	return worker.RunAutologin(config)
}

func handleCopy(payload []byte) error {
	var config worker.ActionCopy
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON: %w", err)
	}
	return worker.RunCopy(config)
}

func handleMksquashfs(payload []byte) error {
	var config worker.ActionMksquashfs
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON: %w", err)
	}
	return worker.RunMksquashfs(config)
}

func handleTemplate(payload []byte) error {
	var config worker.ActionTemplate
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON: %w", err)
	}
	return worker.RunTemplate(config)
}

func handleXorriso(payload []byte) error {
	// Mappiamo il JSON sulla struct dedicata (da creare in worker/xorriso.go)
	var config worker.ActionXorriso
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON: %w", err)
	}
	return worker.RunXorriso(config)
}

func handleShell(payload []byte) error {
	worker.RunShell(payload)
	return nil
}
