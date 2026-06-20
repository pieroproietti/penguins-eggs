package cmd

import (
	"github.com/spf13/cobra"
)

var toolsCmd = &cobra.Command{
	Use:   "tools",
	Short: "Useful tools for maintenance and system management",
	Long: `A suite of auxiliary tools provided by coa for the management,
cleaning, and inspection of the host system and ISOs.`,
}

func init() {
	rootCmd.AddCommand(toolsCmd)
}
