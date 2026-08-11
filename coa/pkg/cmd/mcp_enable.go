package cmd

import (
	"coa/pkg/mcp"

	"github.com/spf13/cobra"
)

var mcpEnableCmd = &cobra.Command{
	Use:   "enable",
	Short: "Provision penguins-eggs MCP server configuration and sudoers permissions",
	Long: `Configures sudoers rules for passwordless execution of eggs commands and injects 
the penguins-eggs MCP node into standard client configuration files (Antigravity, Claude, Roo-Cline, etc.).`,
	Example: `  # Enable MCP server (requires sudo)
  sudo eggs mcp enable`,
	RunE: func(cmd *cobra.Command, args []string) error {
		CheckSudoRequirements("mcp enable", true)
		return mcp.Enable()
	},
}

func init() {
	mcpCmd.AddCommand(mcpEnableCmd)
}
