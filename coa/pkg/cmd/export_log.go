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

		// 1. Usiamo una mappa: [percorso locale] -> [nome file remoto]
		// Qui facciamo la "magia" della ridenominazione per il log
		files := map[string]string{
			"/var/log/oa-tools.log": "oa-tools.log.txt",
			"/tmp/coa/oa-plan.json": "oa-plan.json",
		}

		remoteHost := fmt.Sprintf("%s@%s", user, ip)

		// 2. Prepariamo il comando di pulizia remota (usando il NUOVO nome del log)
		cleanCmd := fmt.Sprintf("rm -f %s/oa-tools.log.txt %s/oa-plan.json", dir, dir)

		utils.LogNormal("🚀 Connessione a %s e sincronizzazione in corso...", remoteHost)

		// 3. Eseguiamo la pulizia REMOTA via SSH
		sshCmd := exec.Command("ssh", remoteHost, cleanCmd)
		if err := sshCmd.Run(); err != nil {
			utils.LogWarning("Avviso: impossibile pulire la destinazione: %v", err)
		}

		// 4. Inviamo i file esistenti iterando sulla mappa
		inviati := 0
		for localPath, remoteName := range files {
			if _, err := os.Stat(localPath); err == nil {
				// Costruiamo il percorso di destinazione ESATTO: user@ip:/dir/nuovo_nome
				destPath := fmt.Sprintf("%s:%s/%s", remoteHost, dir, remoteName)

				scpCmd := exec.Command("scp", localPath, destPath)
				scpCmd.Stdout = os.Stdout
				scpCmd.Stderr = os.Stderr

				if err := scpCmd.Run(); err != nil {
					utils.LogError("Errore durante l'invio di %s: %v", localPath, err)
					os.Exit(1)
				}
				inviati++
			}
		}

		if inviati == 0 {
			utils.LogError("Nessun file da esportare trovato.")
			return
		}

		utils.LogSuccess("Operazione completata! %d file esportati con successo.", inviati)
	},
}

func init() {
	exportCmd.AddCommand(exportLogCmd)

	exportLogCmd.Flags().StringP("user", "u", "artisan", "Utente SSH di destinazione")
	exportLogCmd.Flags().StringP("ip", "i", "192.168.1.2", "Indirizzo IP di destinazione")
	exportLogCmd.Flags().StringP("dir", "d", "/home/artisan", "Directory di destinazione")
}
