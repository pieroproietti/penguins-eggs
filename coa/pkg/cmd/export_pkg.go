package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"coa/pkg/distro"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var exportPkgCmd = &cobra.Command{
	Use:   "pkg",
	Short: "Export native packages (.deb, .rpm, .pkg.tar.zst) to Proxmox",
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements(cmd.Name(), false)
		handleExportPkg(cleanExport) // Usa la variabile globale di export.go
	},
}

func init() {
	exportCmd.AddCommand(exportPkgCmd)
}

func handleExportPkg(clean bool) {
	myDistro := distro.NewDistro()
	distroID := myDistro.DistroID
	family := myDistro.FamilyID

	utils.LogNormal("Famiglia rilevata: %s. Ricerca pacchetti pertinenti...", family)

	var pattern string
	var extension string

	// Filtriamo per estensione in base alla famiglia
	switch family {
	case "debian":
		pattern = "oa-tools*.deb"
		extension = ".deb"
	case "archlinux":
		pattern = "oa-tools-arch-*.pkg.tar.zst"
		extension = ".pkg.tar.zst"
	case "fedora":
		pattern = "oa-tools*.rpm"
		extension = ".rpm"
	case "manjaro":
		pattern = "oa-tools-manjaro-*.pkg.tar.zst"
		extension = ".pkg.tar.zst"
	default:
		// Fatal stampa e chiude l'esecuzione
		utils.Fatal("Nessuna regola di esportazione specifica per la distro %s della famiglia: %s", distroID, family)
	}

	foundFiles, _ := filepath.Glob(pattern)
	if len(foundFiles) == 0 {
		utils.Fatal("Nessun pacchetto %s trovato per l'esportazione.", extension)
	}

	// SSH Multiplexing: prepariamo le opzioni come stringa singola
	socketPath := "/tmp/coa-ssh-mux-pkg"
	muxOpts := fmt.Sprintf("-o ControlMaster=auto -o ControlPath=%s -o ControlPersist=2m", socketPath)

	defer func() {
		stopMuxCmd := fmt.Sprintf("ssh -O exit -o ControlPath=%s %s", socketPath, remoteUserHost)
		utils.ExecQuiet(stopMuxCmd)
		os.Remove(socketPath)
	}()

	if clean {
		utils.LogNormal("Pulizia remota vecchi pacchetti %s...", extension)
		cleanCmdStr := fmt.Sprintf("rm -f %s%s", remotePkgPath, pattern)

		// Il comando ssh assemblato come stringa
		sshCmd := fmt.Sprintf("ssh %s %s '%s'", muxOpts, remoteUserHost, cleanCmdStr)

		if err := utils.ExecQuiet(sshCmd); err != nil {
			utils.LogNormal("Pulizia remota non necessaria o fallita (nessun file trovato).")
		} else {
			utils.LogSuccess("Vecchi pacchetti %s rimossi dal server.", extension)
		}
	}

	for _, pkg := range foundFiles {
		utils.LogNormal("Esportazione: %s", pkg)
		dstStr := fmt.Sprintf("%s:%s", remoteUserHost, remotePkgPath)

		// Il comando scp assemblato come stringa
		scpCmd := fmt.Sprintf("scp %s '%s' '%s'", muxOpts, pkg, dstStr)

		if err := utils.Exec(scpCmd); err != nil {
			utils.LogError("Trasferimento fallito per %s: %v", pkg, err)
		} else {
			utils.LogSuccess("%s inviato con successo.", pkg)
		}
	}
}
