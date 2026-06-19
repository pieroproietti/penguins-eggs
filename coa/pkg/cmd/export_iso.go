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
		handleExportIso(cleanExport)
	},
}

func init() {
	exportCmd.AddCommand(exportIsoCmd)
}

func handleExportIso(clean bool) {
	d := distro.NewDistro()
	isoPattern := d.GetISOSearchPattern()

	allFiles, _ := filepath.Glob(filepath.Join(isoSrcDir, isoPattern))
	if len(allFiles) == 0 {
		utils.Fatal("The nest is empty for pattern: %s", isoPattern)
	}
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
	utils.LogNormal("Latest ISO found: %s", targetFileName)
	socketPath := "/tmp/coa-ssh-mux"

	// Start Master Connection (in background)
	startMuxCmd := fmt.Sprintf("ssh -M -f -N -o ControlPath=%s %s", socketPath, remoteUserHost)
	utils.ExecQuiet(startMuxCmd)

	defer func() {
		stopMuxCmd := fmt.Sprintf("ssh -O exit -o ControlPath=%s %s", socketPath, remoteUserHost)
		utils.ExecQuiet(stopMuxCmd)
	}()

	if clean {
		utils.LogNormal("Cleaning Proxmox: removing previous versions matching pattern %s", isoPattern)
		rmCmdStr := fmt.Sprintf("rm -f %s/%s", remoteIsoPath, isoPattern)

		sshCmd := fmt.Sprintf("ssh -o ControlPath=%s %s '%s'", socketPath, remoteUserHost, rmCmdStr)
		if err := utils.ExecQuiet(sshCmd); err != nil {
			utils.LogNormal("No old ISOs removed on Proxmox.")
		}
	}

	utils.LogNormal("Sending %s to Proxmox...", targetFileName)
	dst := fmt.Sprintf("%s:%s", remoteUserHost, remoteIsoPath)

	scpCmd := fmt.Sprintf("scp -o ControlPath=%s '%s' '%s'", socketPath, latestFile, dst)

	if err := utils.Exec(scpCmd); err != nil {
		utils.LogError("Transfer error: %v", err)
	} else {
		utils.LogSuccess("Export completed successfully!")
	}
}
