package cmd

import (
	"coa/pkg/mcp"

	"github.com/spf13/cobra"
)

var mcpStopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop active penguins-eggs MCP server background processes",
	Long:  `Finds and terminates any running 'eggs mcp start' listener instances.`,
	Example: `  # Stop running MCP server daemon
  eggs mcp stop`,
	RunE: func(cmd *cobra.Command, args []string) error {
		return mcp.Stop()
	},
}

func init() {
	mcpCmd.AddCommand(mcpStopCmd)
}
