package cmd

import (
	"coa/pkg/mcp"

	"github.com/spf13/cobra"
)

var mcpStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the penguins-eggs MCP JSON-RPC server daemon (Stdio mode)",
	Long: `Starts the interactive Model Context Protocol daemon over standard input/output.
This command is invoked automatically by AI agents (e.g. Antigravity CLI, Claude Desktop).`,
	Example: `  # Start MCP server listener
  eggs mcp start`,
	RunE: func(cmd *cobra.Command, args []string) error {
		server := mcp.NewServer(AppVersion)
		return server.Start()
	},
}

func init() {
	mcpCmd.AddCommand(mcpStartCmd)
}
