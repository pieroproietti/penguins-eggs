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
		handleExportPkg(cleanExport)
	},
}

func init() {
	exportCmd.AddCommand(exportPkgCmd)
}

func handleExportPkg(clean bool) {
	myDistro := distro.NewDistro()
	distroID := myDistro.DistroID
	family := myDistro.FamilyID

	utils.LogNormal("Detected family: %s. Searching for relevant packages...", family)

	var pattern string
	var extension string

	switch family {
	case "debian":
		pattern = "penguins-eggs*.deb"
		extension = ".deb"
	case "archlinux":
		pattern = "penguins-eggs-arch-*.pkg.tar.zst"
		extension = ".pkg.tar.zst"
	case "fedora":
		pattern = "penguins-eggs*.rpm"
		extension = ".rpm"
	case "manjaro":
		pattern = "penguins-eggs-manjaro-*.pkg.tar.zst"
		extension = ".pkg.tar.zst"
	default:
		utils.Fatal("No specific export rule for distro %s of family: %s", distroID, family)
	}

	foundFiles, _ := filepath.Glob(pattern)
	if len(foundFiles) == 0 {
		utils.Fatal("No %s package found for export.", extension)
	}

	socketPath := "/tmp/coa-ssh-mux-pkg"
	muxOpts := fmt.Sprintf("-o ControlMaster=auto -o ControlPath=%s -o ControlPersist=2m", socketPath)

	defer func() {
		stopMuxCmd := fmt.Sprintf("ssh -O exit -o ControlPath=%s %s", socketPath, remoteUserHost)
		utils.ExecQuiet(stopMuxCmd)
		os.Remove(socketPath)
	}()

	if clean {
		utils.LogNormal("Remote cleanup of old %s packages...", extension)
		cleanCmdStr := fmt.Sprintf("rm -f %s%s", remotePkgPath, pattern)

		sshCmd := fmt.Sprintf("ssh %s %s '%s'", muxOpts, remoteUserHost, cleanCmdStr)

		if err := utils.ExecQuiet(sshCmd); err != nil {
			utils.LogNormal("Remote cleanup not needed or failed (no files found).")
		} else {
			utils.LogSuccess("Old %s packages removed from server.", extension)
		}
	}

	for _, pkg := range foundFiles {
		utils.LogNormal("Exporting: %s", pkg)
		dstStr := fmt.Sprintf("%s:%s", remoteUserHost, remotePkgPath)

		scpCmd := fmt.Sprintf("scp %s '%s' '%s'", muxOpts, pkg, dstStr)

		if err := utils.Exec(scpCmd); err != nil {
			utils.LogError("Transfer failed for %s: %v", pkg, err)
		} else {
			utils.LogSuccess("%s sent successfully.", pkg)
		}
	}
}
