package cmd

import (
	"coa/pkg/bleach"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var cleanVerbose bool

var toolsCleanCmd = &cobra.Command{
	Use:   "clean",
	Short: "Log rotation, package manager cache cleanup, and host system remnants",
	Long: `It streamlines the system by removing unnecessary files.
Ideal to run before ‘coa remaster’ to create a more compact ISO.`,
	Example: `  sudo coa tools clean
  sudo coa tools clean --verbose`,
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements(cmd.Name(), true)

		utils.LogNormal("Starting Bleach (deep cleanup)...")

		b := bleach.New(cleanVerbose)
		if err := b.Clean(); err != nil {
			utils.Fatal("Cleanup interrupted: %v", err)
		}

		utils.LogSuccess("System clean! Your ISO will now be leaner.")
	},
}

func init() {
	toolsCleanCmd.Flags().BoolVarP(&cleanVerbose, "verbose", "v", false, "Show detailed output of cleanup commands")
	toolsCmd.AddCommand(toolsCleanCmd)
}
