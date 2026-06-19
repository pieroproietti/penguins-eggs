package cmd

import (
	"coa/pkg/pathDefaults"

	"github.com/spf13/cobra"
)

// --- CONFIGURAZIONE ESPORTAZIONE CONDIVISA ---
const (
	remoteUserHost = "root@192.168.1.2"
	remoteIsoPath  = "/var/lib/vz/template/iso/"
	remotePkgPath  = "/eggs/"
)

var isoSrcDir = pathDefaults.DefaultWorkPath

var cleanExport bool

var exportCmd = &cobra.Command{
	Use:   "export",
	Short: "Export artifacts (iso, pkg) to a remote Proxmox storage",
	Long: `The export command handles the transfer of produced artifacts
(installation ISOs or distribution packages) to configured remote servers,
automating cleanup and versioning.`,
}

func init() {
	exportCmd.PersistentFlags().BoolVar(&cleanExport, "clean", false, "Clean old versions on remote server before exporting")
	rootCmd.AddCommand(exportCmd)
}
