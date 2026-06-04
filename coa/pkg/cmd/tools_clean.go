package cmd

import (
	"os"

	"coa/pkg/bleach" // Assicurati che il path sia corretto
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var cleanVerbose bool

var toolsCleanCmd = &cobra.Command{
	Use:   "clean",
	Short: "Pulisce log, cache apt/pacman e residui del sistema host",
	Long: `Dimagrisce il sistema rimuovendo file non necessari.
Ideale da lanciare prima di 'coa remaster' per ottenere una ISO più compatta.`,
	Example: `  sudo coa tools clean
  sudo coa tools clean --verbose`,
	Run: func(cmd *cobra.Command, args []string) {
		// Controllo root: la pulizia profonda richiede i privilegi massimi
		if os.Geteuid() != 0 {
			utils.Fatal(" Il comando clean deve essere eseguito come root (sudo).")
			os.Exit(1)
		}

		LogNormal("Inizio procedura di Bleach (pulizia profonda)...")

		b := bleach.New(cleanVerbose)
		if err := b.Clean(); err != nil {
			utils.LogError("Pulizia interrotta: %v", err)
			os.Exit(1)
		}
		LogSuccess("Sistema pulito! Ora la tua ISO sarà più snella.")
	},
}

func init() {
	toolsCleanCmd.Flags().BoolVarP(&cleanVerbose, "verbose", "v", false, "Mostra l'output dettagliato dei comandi di pulizia")
	toolsCmd.AddCommand(toolsCleanCmd)
}
