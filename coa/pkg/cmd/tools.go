package cmd

import (
	"github.com/spf13/cobra"
)

// toolsCmd rappresenta il comando padre "tools"
var toolsCmd = &cobra.Command{
	Use:   "tools",
	Short: "Useful tools for maintenance and system management",
	Long: `A suite of auxiliary tools provided by coa for the management, 
cleaning, and inspection of the host system and ISOs.`,
	// Non definiamo una funzione Run, così se l'utente digita solo "coa tools",
	// Cobra stamperà in automatico l'help con la lista dei sotto-comandi (es. clean).
}

func init() {
	// Aggiungiamo tools al comando principale (root)
	// Assicurati che rootCmd sia il nome della variabile del tuo comando principale
	// definito di solito in root.go o main.go
	rootCmd.AddCommand(toolsCmd)
}
