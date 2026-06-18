package cmd

import (
	"coa/pkg/config"
	"coa/pkg/utils"
	"os"

	"github.com/spf13/cobra"
)

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Configura oa-tools (compressione, password live, ecc.)",
	Long: `Interfaccia TUI per modificare la configurazione personalizzata
di oa-tools (/etc/oa-tools.d/custom.yaml).

Permette di impostare l'algoritmo e il livello di compressione,
la password della sessione live e altre opzioni.`,
	Example: `  sudo coa config`,
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements(cmd.Name(), true)

		if err := config.Run(); err != nil {
			utils.LogError("Errore configurazione: %v", err)
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.AddCommand(configCmd)
}
