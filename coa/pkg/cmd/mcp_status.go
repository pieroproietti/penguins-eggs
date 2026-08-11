package cmd

import (
	"coa/pkg/mcp"

	"github.com/spf13/cobra"
)

var mcpStatusCmd = &cobra.Command{
	Use:   "status",
	Short: "Check the status of penguins-eggs MCP server integration",
	Long:  `Displays sudoers permissions, MCP client config status, and running daemon processes.`,
	Example: `  # Check MCP integration status
  eggs mcp status`,
	RunE: func(cmd *cobra.Command, args []string) error {
		return mcp.Status()
	},
}

func init() {
	mcpCmd.AddCommand(mcpStatusCmd)
}
