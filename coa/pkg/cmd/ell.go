// cmd/ell.go
package cmd

import (
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

		// Se il C non ha inviato nulla, usciamo subito
		if len(payload) == 0 {
			fmt.Fprintln(os.Stderr, "coa ell: ricevuto payload vuoto.")
			os.Exit(1)
		}

		// 2. Parsa il JSON su una mappa generica per validarlo
		var task map[string]interface{}
		if err := json.Unmarshal(payload, &task); err != nil {
			fmt.Fprintf(os.Stderr, "coa ell: errore di parsing JSON: %v\n", err)
			fmt.Printf("Payload grezzo corrotto:\n%s\n", string(payload))
			os.Exit(1)
		}

		// 3. Lo riformatta in modo leggibile (Pretty Print)
		prettyJSON, _ := json.MarshalIndent(task, "", "  ")

		// 4. Stampa a video la conferma del passaggio di consegne
		fmt.Println("\n=========================================")
		fmt.Println("🥚 [coa ell] RISVEGLIO ESECUZIONE NATIVA")
		fmt.Printf("Azione ricevuta: %s\n", task["name"])
		fmt.Println("-----------------------------------------")
		fmt.Println(string(prettyJSON))
		fmt.Println("=========================================\n")

		// Esce con 0 (Successo). Il demone C leggerà questo 0 e andrà avanti.
		os.Exit(0)
	},
}

func init() {
	// Aggiunge 'ell' come sottocomando di root ('coa')
	rootCmd.AddCommand(ellCmd)
}
