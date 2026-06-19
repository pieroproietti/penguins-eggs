package cmd

import (
	"coa/pkg/bleach"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var cleanVerbose bool

var toolsCleanCmd = &cobra.Command{
	Use:   "clean",
	Short: "Log rotation, package manager cache cleanup, and host system remnants",
	Long: `It streamlines the system by removing unnecessary files.
Ideal to run before ‘coa remaster’ to create a more compact ISO.`,
	Example: `  sudo coa tools clean
  sudo coa tools clean --verbose`,
	Run: func(cmd *cobra.Command, args []string) {
		// Sostituiamo il check manuale con la funzione centralizzata del pacchetto cmd
		CheckSudoRequirements(cmd.Name(), true)

		utils.LogNormal("Inizio procedura di Bleach (pulizia profonda)...")

		b := bleach.New(cleanVerbose)
		if err := b.Clean(); err != nil {
			// Fatal stampa in rosso ed esce da solo con codice 1
			utils.Fatal("Pulizia interrotta: %v", err)
		}

		utils.LogSuccess("Sistema pulito! Ora la tua ISO sarà più snella.")
	},
}

func init() {
	toolsCleanCmd.Flags().BoolVarP(&cleanVerbose, "verbose", "v", false, "Mostra l'output dettagliato dei comandi di pulizia")
	toolsCmd.AddCommand(toolsCleanCmd)
}
