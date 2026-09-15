package cmd

import (
	"os"
	"os/exec"

	"coa/pkg/sysinstall/krill/engine"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var sysinstallCoexist bool

var sysinstallCmd = &cobra.Command{
	Use:   "sysinstall",
	Short: "Launch the system installer (GUI or TUI)",
	Long: `sysinstall configures the TUI and GUI installers and launches them.
If run without subcommands, it automatically launches Calamares (if present and display server active),
or falls back to Krill TUI installer.

Examples:
  sudo eggs sysinstall
  sudo eggs sysinstall calamares
  sudo eggs sysinstall krill`,
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements("sysinstall", true)
		hasCoexist := len(engine.DetectCoexistDisks()) > 0
		if !utils.IsLive() && !sysinstallCoexist && !hasCoexist {
			utils.Fatal("sysinstall can only be run on a live system, unless a Coexist disk is present.")
		}

		if sysinstallCoexist || (!utils.IsLive() && hasCoexist) {
			utils.LogNormal("Launching Krill installer in Coexist mode...")
			krillSubCmd.Run(cmd, args)
			return
		}

		if isCalamaresAvailable() {
			utils.LogNormal("Calamares detected in graphical environment. Launching Calamares GUI...")
			calamaresSubCmd.Run(cmd, args)
			return
		}

		utils.LogNormal("Launching Krill TUI installer...")
		krillSubCmd.Run(cmd, args)
	},
}

func isCalamaresAvailable() bool {
	if _, err := exec.LookPath("calamares"); err != nil {
		return false
	}
	display := os.Getenv("DISPLAY")
	waylandDisplay := os.Getenv("WAYLAND_DISPLAY")
	return display != "" || waylandDisplay != ""
}

func init() {
	rootCmd.AddCommand(sysinstallCmd)
}
