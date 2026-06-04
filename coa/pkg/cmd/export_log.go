package cmd

import (
	"coa/pkg/utils"
	"fmt"
	"os"
	"os/exec"

	"github.com/spf13/cobra"
)

var exportLogCmd = &cobra.Command{
	Use:   "log",
	Short: "Esporta log e piano in un unico comando",
	Run: func(cmd *cobra.Command, args []string) {
		user, _ := cmd.Flags().GetString("user")
		ip, _ := cmd.Flags().GetString("ip")
		dir, _ := cmd.Flags().GetString("dir")

		// 1. Definiamo i file locali
		files := []string{"/var/log/oa-tools.log", "/tmp/coa/oa-plan.json"}

		// 2. Prepariamo il comando di pulizia remota
		// Usiamo 'rm -f' per evitare errori se i file non esistono
		cleanCmd := fmt.Sprintf("rm -f %s/oa-tools.log %s/oa-plan.json", dir, dir)

		// 3. Eseguiamo la pulizia REMOTA via SSH e subito dopo l'SCP
		// Usiamo '&&' per garantire che se la pulizia fallisce, l'invio non parte
		remoteHost := fmt.Sprintf("%s@%s", user, ip)

		utils.LogNormal("🚀 Connessione a %s e sincronizzazione in corso...", remoteHost)

		// Eseguiamo il comando di pulizia
		sshCmd := exec.Command("ssh", remoteHost, cleanCmd)
		if err := sshCmd.Run(); err != nil {
			utils.LogWarning("Avviso: impossibile pulire la destinazione: %v", err)
		}

		// 4. Inviamo i file esistenti
		var toSend []string
		for _, f := range files {
			if _, err := os.Stat(f); err == nil {
				toSend = append(toSend, f)
			}
		}

		if len(toSend) == 0 {
			utils.LogError("Nessun file da esportare trovato.")
			return
		}

		scpArgs := append(toSend, fmt.Sprintf("%s:%s/", remoteHost, dir))
		scpCmd := exec.Command("scp", scpArgs...)
		scpCmd.Stdout = os.Stdout
		scpCmd.Stderr = os.Stderr

		if err := scpCmd.Run(); err != nil {
			utils.LogError("Errore durante l'invio: %v", err)
			os.Exit(1)
		}

		utils.LogSuccess("Operazione completata in un unico passaggio.")
	},
}

func init() {
	exportCmd.AddCommand(exportLogCmd)

	// DEVI definire i flag qui, altrimenti il comando non sa cosa cercare
	exportLogCmd.Flags().StringP("user", "u", "artisan", "Utente SSH di destinazione")
	exportLogCmd.Flags().StringP("ip", "i", "192.168.1.2", "Indirizzo IP di destinazione")
	exportLogCmd.Flags().StringP("dir", "d", "/home/artisan", "Directory di destinazione")
}
