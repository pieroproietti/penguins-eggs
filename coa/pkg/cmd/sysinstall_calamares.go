package cmd

import (
	"coa/pkg/census"
	"coa/pkg/sysinstall/setup"
	"coa/pkg/utils"
	"io"
	"os"
	"os/exec"

	"github.com/spf13/cobra"
)

var calamaresSubCmd = &cobra.Command{
	Use:   "calamares",
	Short: "Launch the Calamares graphical installer",
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements("sysinstall calamares", true)
		if !utils.IsLive() {
			utils.Fatal("sysinstall calamares can only be run on a live system.")
		}
		RunCalamaresInstaller(AppVersion)
	},
}

const calamaresCensusMarker = "/run/penguins-eggs-census-sysinstall.sent"

func RunCalamaresInstaller(oaVersion string) {
	_ = os.Setenv("EGGS_VERSION", oaVersion)
	if sysinstallAnonymous {
		_ = os.Setenv("EGGS_ANONYMOUS", "1")
	}
	_ = os.Remove(calamaresCensusMarker)

	if err := setup.BuildInstaller(oaVersion); err != nil {
		utils.LogError("Installer environment setup error: %v", err)
		os.Exit(1)
	}

	utils.LogNormal("Starting the Calamares graphical installer...")

	logPath := "/var/log/calamares-install.log"
	logFile, err := os.Create(logPath)
	if err != nil {
		utils.LogError("Unable to create log file %s: %v", logPath, err)
		os.Exit(1)
	}
	defer logFile.Close()

	cmdExec := exec.Command("calamares", "-d", "-D", "8", "-c", "/etc/penguins-eggs.d/installer.d/")

	multiWriter := io.MultiWriter(os.Stdout, logFile)
	cmdExec.Stdout = multiWriter
	cmdExec.Stderr = multiWriter

	if err := cmdExec.Run(); err != nil {
		utils.LogError("The graphical installer was interrupted with an error: %v", err)
		os.Exit(1)
	}

	if _, err := os.Stat(calamaresCensusMarker); os.IsNotExist(err) {
		_, isCrypted, isClone := census.DetectLiveSourceMode(setup.FindSquashfsPath())
		census.Send(census.EventOptions{
			Action:      "sysinstall",
			EggsVersion: oaVersion,
			Anonymous:   sysinstallAnonymous || isCrypted,
			Crypted:     isCrypted,
			Clone:       isClone,
			Compression: "",
			Coexist:     false,
		})
	}

	utils.LogNormal("Calamares installation finished.")
	os.Exit(0)
}

func init() {
	sysinstallCmd.AddCommand(calamaresSubCmd)
}
