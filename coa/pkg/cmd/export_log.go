package cmd

import (
	"coa/pkg/utils"
	"encoding/base64"
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

		remoteHost := fmt.Sprintf("%s@%s", user, ip)

		// Prepara i file da inviare
		files := []struct {
			LocalPath  string
			RemoteName string
		}{
			{"/var/log/oa-tools.log", "oa-tools.log.txt"},
			{"/tmp/coa/oa-plan.json", "oa-plan.json"},
			{"/tmp/oa-failed-yaml.txt", "oa-failed.yaml"},
		}

		// Verifica quali file esistono
		validFiles := []struct {
			LocalPath  string
			RemoteName string
		}{}

		for _, f := range files {
			if _, err := os.Stat(f.LocalPath); err == nil {
				validFiles = append(validFiles, f)
				utils.LogNormal("📄 Trovato: %s -> %s", f.LocalPath, f.RemoteName)
			} else {
				utils.LogWarning("File non trovato: %s", f.LocalPath)
			}
		}

		if len(validFiles) == 0 {
			utils.LogError("Nessun file da esportare trovato.")
			os.Exit(1)
		}

		utils.LogNormal("🚀 Connessione a %s (una sola password richiesta)...", remoteHost)

		// Costruisci dinamicamente il comando remoto per tutti i file
		remoteCmd := fmt.Sprintf(`cd %s || exit 1`, dir)

		// Aggiungi la pulizia di TUTTI i file remoti
		remoteCmd += "\n# Pulisci i file vecchi\n"
		for _, f := range validFiles {
			remoteCmd += fmt.Sprintf("rm -f %s\n", f.RemoteName)
		}

		// Aggiungi la ricezione di TUTTI i file
		remoteCmd += "\n# Ricevi i nuovi file (formato: dimensione|base64|EOF)\n"
		for _, f := range validFiles {
			remoteCmd += fmt.Sprintf(`
# Ricevi %s
read size
if [ "$size" = "EOF" ]; then break; fi
dd bs=1 count=$size 2>/dev/null | base64 -d > %s
`, f.RemoteName, f.RemoteName)
		}
		remoteCmd += "\nread size # legge l'EOF finale"

		// Crea un comando SSH con stdin pipe
		sshCmd := exec.Command("ssh", remoteHost, remoteCmd)
		sshCmd.Stderr = os.Stderr

		// Crea una pipe per l'stdin
		stdin, err := sshCmd.StdinPipe()
		if err != nil {
			utils.LogError("Errore nella creazione della pipe: %v", err)
			os.Exit(1)
		}

		// Avvia il comando SSH
		if err := sshCmd.Start(); err != nil {
			utils.LogError("Errore nell'avvio di SSH: %v", err)
			os.Exit(1)
		}

		// Invia ogni file codificato in base64 con un header (dimensione)
		for _, f := range validFiles {
			// Leggi il file
			fileData, err := os.ReadFile(f.LocalPath)
			if err != nil {
				utils.LogError("Impossibile leggere %s: %v", f.LocalPath, err)
				os.Exit(1)
			}

			// Codifica in base64
			encoded := base64.StdEncoding.EncodeToString(fileData)
			size := len(encoded)

			// Invia: prima la dimensione, poi il contenuto base64
			fmt.Fprintf(stdin, "%d\n%s\n", size, encoded)
			utils.LogNormal("📤 Inviato %s (%d bytes)", f.RemoteName, len(fileData))
		}

		// Invia EOF per segnalare la fine
		fmt.Fprintf(stdin, "EOF\n")

		// Chiudi stdin per segnalare la fine della trasmissione
		stdin.Close()

		// Attendi il completamento del comando SSH
		if err := sshCmd.Wait(); err != nil {
			utils.LogError("Errore durante l'esecuzione remota: %v", err)
			os.Exit(1)
		}

		utils.LogSuccess("Operazione completata! %d file esportati con successo.", len(validFiles))
	},
}

func init() {
	exportCmd.AddCommand(exportLogCmd)

	exportLogCmd.Flags().StringP("user", "u", "artisan", "Utente SSH di destinazione")
	exportLogCmd.Flags().StringP("ip", "i", "192.168.1.2", "Indirizzo IP di destinazione")
	exportLogCmd.Flags().StringP("dir", "d", "/home/artisan", "Directory di destinazione")
}
