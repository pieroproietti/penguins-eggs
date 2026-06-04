package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"coa/pkg/distro"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var exportIsoCmd = &cobra.Command{
	Use:   "iso",
	Short: "Export the latest ISO to a remote Proxmox storage",
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements(cmd.Name(), false)
		handleExportIso(cleanExport) // Usa la variabile globale di export.go
	},
}

func init() {
	exportCmd.AddCommand(exportIsoCmd)
}

func handleExportIso(clean bool) {
	// 1. Otteniamo il prefisso dinamico (egg-of-distro-host-arch-)
	d := distro.NewDistro()
	prefixBase := d.GetISOPrefix()
	isoPattern := prefixBase + "*.iso"

	// Ricerca nel nido locale
	allFiles, _ := filepath.Glob(filepath.Join(isoSrcDir, isoPattern))
	if len(allFiles) == 0 {
		utils.Fatal("Il nido è vuoto per il prefisso: %s", prefixBase)
	}

	// 2. Identificazione dell'ultima ISO (basata su ModTime)
	var latestFile string
	var latestTime time.Time

	for _, path := range allFiles {
		if info, err := os.Stat(path); err == nil {
			if info.ModTime().After(latestTime) {
				latestTime = info.ModTime()
				latestFile = path
			}
		}
	}

	targetFileName := filepath.Base(latestFile)
	utils.LogNormal("Ultima ISO trovata: %s", targetFileName)

	// 3. Setup SSH Multiplexing
	socketPath := "/tmp/coa-ssh-mux"

	// Start Master Connection (in background)
	startMuxCmd := fmt.Sprintf("ssh -M -f -N -o ControlPath=%s %s", socketPath, remoteUserHost)
	utils.ExecQuiet(startMuxCmd)

	// Assicuriamoci di chiudere il socket alla fine, avvolgendo il comando nel defer
	defer func() {
		stopMuxCmd := fmt.Sprintf("ssh -O exit -o ControlPath=%s %s", socketPath, remoteUserHost)
		utils.ExecQuiet(stopMuxCmd)
	}()

	// 4. Logica di Pulizia su Proxmox
	if clean {
		utils.LogNormal("Pulizia su Proxmox: rimozione versioni precedenti con prefisso %s", prefixBase)
		rmCmdStr := fmt.Sprintf("rm -f %s/%s*.iso", remoteIsoPath, prefixBase)

		// Eseguiamo silenziosamente il comando remoto tramite il socket SSH
		sshCmd := fmt.Sprintf("ssh -o ControlPath=%s %s '%s'", socketPath, remoteUserHost, rmCmdStr)
		if err := utils.ExecQuiet(sshCmd); err != nil {
			utils.LogNormal("Nessuna vecchia ISO rimossa su Proxmox.")
		}
	}

	// 5. Invio effettivo
	utils.LogNormal("Inviando %s verso Proxmox...", targetFileName)
	dst := fmt.Sprintf("%s:%s", remoteUserHost, remoteIsoPath)

	// Il comando SCP formattato in modo lineare
	scpCmd := fmt.Sprintf("scp -o ControlPath=%s '%s' '%s'", socketPath, latestFile, dst)

	if err := utils.Exec(scpCmd); err != nil {
		utils.LogError("Errore durante il trasferimento: %v", err)
	} else {
		utils.LogSuccess("Esportazione completata con successo!")
	}
}
