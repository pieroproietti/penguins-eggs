package cmd

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/spf13/cobra"
)

// logCmd rappresenta il sotto-comando "export log"
var logCmd = &cobra.Command{
	Use:   "log",
	Short: "Esporta il log di oa-tools sull'host principale",
	Run: func(cmd *cobra.Command, args []string) {
		// Recuperiamo i flag
		targetUser, _ := cmd.Flags().GetString("user")
		targetIP, _ := cmd.Flags().GetString("ip")
		targetDir, _ := cmd.Flags().GetString("dir")

		sourceFile := "/var/log/oa-tools.log"
		destination := fmt.Sprintf("%s@%s:%s", targetUser, targetIP, targetDir)

		fmt.Printf("🚀 Esportazione log in corso...\nDa: %s\nA:  %s\n", sourceFile, destination)

		// Costruiamo il comando scp
		scpCmd := exec.Command("scp", sourceFile, destination)

		// Agganciamo l'output standard per gestire password/errori
		scpCmd.Stdout = os.Stdout
		scpCmd.Stderr = os.Stderr

		err := scpCmd.Run()
		if err != nil {
			fmt.Printf("❌ Errore durante l'esportazione: %v\n", err)
			os.Exit(1)
		}

		fmt.Println("✅ Log esportato con successo! Pronto per essere analizzato.")
	},
}

func init() {
	// Ci agganciamo semplicemente al comando padre exportCmd che hai già definito altrove
	exportCmd.AddCommand(logCmd)

	// Definiamo i flag di default comodi per la tua rete
	logCmd.Flags().StringP("user", "u", "artisan", "Utente SSH di destinazione")
	logCmd.Flags().StringP("ip", "i", "192.168.1.2", "Indirizzo IP di destinazione")
	logCmd.Flags().StringP("dir", "d", "/home/artisan", "Directory di destinazione")
}
