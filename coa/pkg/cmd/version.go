package cmd

import (
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version number of coa",
	Run: func(cmd *cobra.Command, args []string) {
		// Non richiede permessi di root
		CheckSudoRequirements(cmd.Name(), false)
		utils.LogNormal("coa %s - The Mind of remaster", AppVersion)
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
