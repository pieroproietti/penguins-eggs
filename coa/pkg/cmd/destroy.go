package cmd

import (
	"os"

	"coa/pkg/pathDefaults"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var destroyCmd = &cobra.Command{
	Use:   "destroy",
	Short: "Free the nest and unmount filesystems",
	Long: `Safely tears down the remastering environment. 
It uses MNT_DETACH to unmount the OverlayFS and virtual API filesystems (/dev, /proc, /sys) without affecting the running host, then removes the temporary workspace.`,
	Example: `  # Clean up the default workspace
  sudo coa destroy`,
	Run: func(cmd *cobra.Command, args []string) {
		// Controllo sudo: smontare filesystem e cancellare /home/eggs richiede i privilegi
		CheckSudoRequirements(cmd.Name(), true)
		handledestroy()
	},
}

var killCmd = &cobra.Command{
	Use:    "kill",
	Short:  "Alias for destroy - aggressively free the nest",
	Hidden: false, // O true se vuoi tenerlo un "easter egg" per esperti
	Run: func(cmd *cobra.Command, args []string) {
		// Stessa logica di protezione
		CheckSudoRequirements("kill", true)
		handledestroy()
	},
}

func init() {
	rootCmd.AddCommand(destroyCmd)
	rootCmd.AddCommand(killCmd) // Aggiungiamo anche questo
}

// =====================================================================
// LOGICA DI PULIZIA
// =====================================================================

// handledestroy gestisce la pulizia profonda invocando prima oa e poi rimuovendo la directory
func handledestroy() {
	utils.LogNormal("Freeing the nest...")

	// 1. Chiamiamo il motore C per smontare in sicurezza i mountpoint
	// Grazie a utils.Exec ci risparmiamo tutto il setup di Stdout/Stderr
	if err := utils.Exec("oa cleanup"); err != nil {
		utils.LogError("Cleanup (unmount) failed: %v", err)
		// Non blocchiamo l'esecuzione qui, proviamo comunque a rimuovere la cartella
	}

	// 2. Rimozione fisica della workspace
	workPath := pathDefaults.DefaultWorkPath
	utils.LogNormal("Removing workspace: %s", workPath)

	if err := utils.Exec("rm -rf " + workPath); err != nil {
		utils.LogError("Physical removal failed: %v", err)
	} else {
		utils.LogSuccess("Nest is empty. System clean.")
	}

	// 3. Rimozione del file di log di oa
	logFile := pathDefaults.LogFile
	utils.LogNormal("Removing log file: %s", logFile)

	if err := os.Remove(logFile); err != nil {
		if os.IsNotExist(err) {
			utils.LogNormal("Log file '%s' non trovato, nulla da rimuovere.", logFile)
		} else {
			utils.LogError("Failed to remove log file: %v", err)
		}
	} else {
		utils.LogSuccess("Log file eliminato con successo.")
	}
}
