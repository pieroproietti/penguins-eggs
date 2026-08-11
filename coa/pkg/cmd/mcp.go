package cmd

import (
	"github.com/spf13/cobra"
)

var mcpCmd = &cobra.Command{
	Use:   "mcp",
	Short: "Model Context Protocol (MCP) server management for AI agents",
	Long: `Manage penguins-eggs as an MCP server for AI agents (Antigravity CLI, Claude, etc.).
Allows enabling/disabling client configurations, configuring sudoers rules, 
and starting the Stdio JSON-RPC daemon listener.`,
}

func init() {
	rootCmd.AddCommand(mcpCmd)
}
