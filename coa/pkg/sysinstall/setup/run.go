package setup

import (
	"coa/pkg/utils"
	"fmt"
	"io"
	"os"
	"os/exec"
)

// Run è l'entrypoint esposto. Genera e lancia.
func Run(oaVersion string) error {
	// Delega tutta la logica di costruzione all'Orchestratore
	if err := buildInstaller(oaVersion); err != nil {
		return fmt.Errorf("impossibile costruire l'installer: %v", err)
	}

	// Avvia l'esecuzione fisica
	return Launch()
}

// Launch avvia effettivamente il processo Calamares e gestisce i log
func Launch() error {
	logFile, err := os.Create("/var/log/calamares.log")
	if err != nil {
		return fmt.Errorf("impossibile creare il file di log: %v", err)
	}
	defer logFile.Close()

	cmd := exec.Command("calamares", "-d", "-D", "8", "-c", "/etc/oa-tools.d/installer.d/")

	multiWriter := io.MultiWriter(os.Stdout, logFile)
	cmd.Stdout = multiWriter
	cmd.Stderr = multiWriter

	utils.LogNormal("Avvio Calamares GUI...")
	return cmd.Run()
}
