package cmd

import (
	"github.com/spf13/cobra"
)

// sysinstallCmd è il comando padre: 'coa sysinstall'
// Funge da punto di ingresso unico per tutti i motori di installazione.
var sysinstallCmd = &cobra.Command{
	Use:   "sysinstall",
	Short: "Launch the system installer (GUI or TUI)",
	Long: `sysinstall configures the TUI and GUI installers and launches them

Example:
  sudo coa sysinstall calamares
  sudo coa sysinstall krill`,
	Run: func(cmd *cobra.Command, args []string) {
		// Se l'utente non specifica un sottocomando, mostriamo l'aiuto
		// Questo evita che il comando non faccia nulla se invocato da solo.
		cmd.Help()
	},
}

func init() {
	// Registriamo sysinstall nel comando principale di coa
	rootCmd.AddCommand(sysinstallCmd)
}
