package cmd

import (
	"coa/pkg/sysinstall/setup"
	"coa/pkg/utils"
	"io"
	"os"
	"os/exec"

	"github.com/spf13/cobra"
)

var calamaresSubCmd = &cobra.Command{
	Use:   "calamares",
	Short: "Lancia l'installatore grafico Calamares",
	Run: func(cmd *cobra.Command, args []string) {
		// Verifichiamo i permessi prima di tutto
		CheckSudoRequirements("sysinstall calamares", true)

		// Esecuzione della pipeline
		RunCalamaresInstaller(AppVersion)
	},
}

// RunCalamaresInstaller coordina la preparazione e il lancio di Calamares
func RunCalamaresInstaller(oaVersion string) {
	// 1. Pipeline unica di preparazione (condivisa con Krill)
	if err := setup.BuildInstaller(oaVersion); err != nil {
		utils.LogError("Errore setup ambiente installer: %v", err)
		os.Exit(1)
	}

	// 2. Lancio fisico di Calamares
	utils.LogNormal("Avvio dell'installatore grafico Calamares in corso...")

	// Creiamo un file di log persistente per Calamares (fondamentale per debuggare l'installazione)
	logPath := "/var/log/calamares-install.log"
	logFile, err := os.Create(logPath)
	if err != nil {
		utils.LogError("Impossibile creare il file di log %s: %v", logPath, err)
		os.Exit(1)
	}
	defer logFile.Close()

	// Costruiamo il comando: debug attivato, livello 8, percorso custom
	cmdExec := exec.Command("calamares", "-d", "-D", "8", "-c", "/etc/oa-tools.d/installer.d/")

	// Usiamo MultiWriter per "sdoppiare" l'output: lo vediamo a schermo e lo salviamo su file
	multiWriter := io.MultiWriter(os.Stdout, logFile)
	cmdExec.Stdout = multiWriter
	cmdExec.Stderr = multiWriter

	// Eseguiamo il comando bloccando l'esecuzione finché la GUI non viene chiusa
	if err := cmdExec.Run(); err != nil {
		utils.LogError("L'installatore grafico si è interrotto con un errore: %v", err)
		os.Exit(1)
	}

	utils.LogNormal("Installazione con Calamares terminata.")
	os.Exit(0)
}

func init() {
	// Appendiamo questo comando a sysinstallCmd
	sysinstallCmd.AddCommand(calamaresSubCmd)
}
