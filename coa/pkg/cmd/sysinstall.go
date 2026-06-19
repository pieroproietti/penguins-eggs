package cmd

import (
	"github.com/spf13/cobra"
)

var sysinstallCmd = &cobra.Command{
	Use:   "sysinstall",
	Short: "Launch the system installer (GUI or TUI)",
	Long: `sysinstall configures the TUI and GUI installers and launches them

Example:
  sudo coa sysinstall calamares
  sudo coa sysinstall krill`,
	Run: func(cmd *cobra.Command, args []string) {
		cmd.Help()
	},
}

func init() {
	rootCmd.AddCommand(sysinstallCmd)
}
