package cmd

import (
	"coa/pkg/mcp"

	"github.com/spf13/cobra"
)

var mcpDisableCmd = &cobra.Command{
	Use:   "disable",
	Short: "Remove penguins-eggs MCP server configuration and sudoers permissions",
	Long: `Removes the penguins-eggs MCP node from client configuration files 
and purges the /etc/sudoers.d/penguins-eggs-mcp rule.`,
	Example: `  # Disable MCP server (requires sudo)
  sudo eggs mcp disable`,
	RunE: func(cmd *cobra.Command, args []string) error {
		CheckSudoRequirements("mcp disable", true)
		return mcp.Disable()
	},
}

func init() {
	mcpCmd.AddCommand(mcpDisableCmd)
}
