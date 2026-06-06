// cmd/ell.go
package cmd

import (
	"coa/pkg/worker"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"

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

		// Se il C non ha inviato nulla, usciamo subito
		if len(payload) == 0 {
			fmt.Fprintln(os.Stderr, "coa ell: ricevuto payload vuoto.")
			os.Exit(1)
		}
		// fmt.Printf("\n[DEBUG-WORKER] JSON Grezzo ricevuto dal C:\n%s\n\n", string(payload))

		// 2. Lettura "esplorativa" per estrarre il nome E il modulo in anticipo
		var taskBase struct {
			Name   string `json:"name"`
			Params struct {
				Module string `json:"module"` // <-- Peschiamo subito il modulo!
			} `json:"params"`
		}
		if err := json.Unmarshal(payload, &taskBase); err != nil {
			fmt.Fprintf(os.Stderr, "coa ell: errore di parsing JSON base: %v\n", err)
			fmt.Printf("Payload grezzo corrotto:\n%s\n", string(payload))
			os.Exit(1)
		}

		// 3. Il Router Dinamico (Stile Ansible)
		// Se c'è un 'module' nei parametri, usiamo quello per lo switch.
		// Altrimenti, per retrocompatibilità con i vecchi task, usiamo il 'Name'.
		route := taskBase.Params.Module
		if route == "" {
			route = taskBase.Name
		}

		// Ora facciamo lo switch sulla rotta calcolata!
		switch route {

		case "coa-autologin-gui":
			// Mappiamo il JSON sulla nostra struct tipizzata rigorosamente
			var config worker.ActionAutologinGui
			if err := json.Unmarshal(payload, &config); err != nil {
				fmt.Fprintf(os.Stderr, "Errore parsing JSON coa-autologin-gui: %v\n", err)
				os.Exit(1) // 1 comunica al C che l'azione è fallita
			}

			// Lanciamo la logica di business in Go
			if err := worker.RunAutologin(config); err != nil {
				fmt.Fprintf(os.Stderr, "Fallimento coa-autologin-gui: %v\n", err)
				os.Exit(1)
			}

			// Finito con successo!
			os.Exit(0)

		case "copy":
			var config worker.ActionCopy
			if err := json.Unmarshal(payload, &config); err != nil {
				fmt.Fprintf(os.Stderr, "Errore parsing JSON modulo copy (%s): %v\n", taskBase.Name, err)
				os.Exit(1)
			}

			if err := worker.RunCopy(config); err != nil {
				fmt.Fprintf(os.Stderr, "Fallimento modulo copy (%s): %v\n", taskBase.Name, err)
				os.Exit(1)
			}

			os.Exit(0)

		case "shell":
			// Struttura semplice: il worker legge solo i parametri che gli servono
			var config struct {
				Params struct {
					Command string `json:"command"`
				} `json:"params"`
			}

			if err := json.Unmarshal(payload, &config); err != nil {
				fmt.Fprintf(os.Stderr, "Errore parsing shell: %v\n", err)
				os.Exit(1)
			}

			// Esecuzione nuda e cruda
			cmd := exec.Command("bash", "-c", config.Params.Command)
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr

			if err := cmd.Run(); err != nil {
				fmt.Fprintf(os.Stderr, "Fallimento shell: %v\n", err)
				os.Exit(1)
			}
			os.Exit(0)

		case "template":
			// Mappiamo il JSON sulla struct dedicata al template
			var config worker.ActionTemplate
			if err := json.Unmarshal(payload, &config); err != nil {
				fmt.Fprintf(os.Stderr, "Errore parsing JSON modulo template (%s): %v\n", taskBase.Name, err)
				os.Exit(1)
			}

			// Lanciamo la logica di business in Go (scrittura del file)
			if err := worker.RunTemplate(config); err != nil {
				fmt.Fprintf(os.Stderr, "Fallimento modulo template (%s): %v\n", taskBase.Name, err)
				os.Exit(1)
			}

			// Finito con successo!
			os.Exit(0)

		case "test-ell":
			// Manteniamo il tuo codice precedente per il debugging puro
			var task map[string]interface{}
			json.Unmarshal(payload, &task)
			prettyJSON, _ := json.MarshalIndent(task, "", "  ")

			fmt.Println("\n=========================================")
			fmt.Println("🥚 [coa ell] RISVEGLIO ESECUZIONE NATIVA (DEBUG MODE)")
			fmt.Printf("Azione ricevuta: %s\n", task["name"])
			fmt.Println("-----------------------------------------")
			fmt.Println(string(prettyJSON))
			fmt.Println("=========================================\n")
			os.Exit(0)

		default:
			// Se il C chiama un'azione che Go non conosce ancora, falliamo puliti
			fmt.Fprintf(os.Stderr, "Azione '%s' non ancora implementata in oa-ell.\n", taskBase.Name)
			os.Exit(1)
		}
	},
}

func init() {
	// Aggiunge 'ell' come sottocomando di root ('coa')
	rootCmd.AddCommand(ellCmd)
}
