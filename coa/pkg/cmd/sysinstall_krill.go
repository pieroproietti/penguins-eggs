package cmd

import (
	"coa/pkg/sysinstall/krill"
	"coa/pkg/sysinstall/setup"
	"coa/pkg/utils"
	"os"

	"github.com/spf13/cobra"
)

var krillUnattended bool

var krillSubCmd = &cobra.Command{
	Use:   "krill",
	Short: "Launch the Krill text installer (TUI)",
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements("sysinstall krill", true)
		if !utils.IsLive() {
			utils.Fatal("sysinstall krill can only be run on a live system.")
		}
		runKrillInstaller(AppVersion, krillUnattended)
	},
}

func runKrillInstaller(oaVersion string, unattended bool) {
	if err := setup.BuildInstaller(oaVersion); err != nil {
		utils.LogError("Installer environment setup error: %v", err)
		os.Exit(1)
	}

	if unattended {
		if err := krill.RunUnattended(); err != nil {
			utils.LogError("Unattended installation failed: %v", err)
			os.Exit(1)
		}
		utils.LogNormal("%s[Krill]%s Unattended installation completed.", utils.ColorGreen, utils.ColorReset)
		os.Exit(0)
	}

	utils.LogNormal("%s[Krill]%s Starting the TUI installer...", utils.ColorCyan, utils.ColorReset)

	if err := krill.Run(); err != nil {
		utils.LogNormal("%s[Krill Error]%s Installation was interrupted: %v", utils.ColorRed, utils.ColorReset, err)
		os.Exit(1)
	}

	utils.LogNormal("%s[Krill]%s Exiting installer.", utils.ColorGreen, utils.ColorReset)
	os.Exit(0)
}

func init() {
	krillSubCmd.Flags().BoolVar(&krillUnattended, "unattended", false,
		"non-interactive installation with defaults (WARNING: erases the first disk)")
	sysinstallCmd.AddCommand(krillSubCmd)
}
