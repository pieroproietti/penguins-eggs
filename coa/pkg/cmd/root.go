package cmd

import (
	"coa/pkg/utils"
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

// AppVersion is injected by the Makefile during build
var AppVersion = "development"

var rootCmd = &cobra.Command{
	Use:   "coa",
	Short: "coa - Calamares & OA Lightweight Architect",
	Long: `coa is the universal orchestrator for penguins-eggs.
Designed to be lightweight and elegant, it reads the distribution-specific
logic from the Brain and drives the OA engine for
system remastering and installation.`,
	Version: AppVersion,
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() {
	rootCmd.CompletionOptions.HiddenDefaultCmd = true
	rootCmd.SetUsageTemplate(`Usage:{{if .Runnable}}
  {{.UseLine}}{{end}}{{if .HasAvailableSubCommands}}
  {{.CommandPath}} [command]{{end}}{{if gt (len .Aliases) 0}}

Aliases:
  {{.NameAndAliases}}{{end}}{{if .HasExample}}

Examples:
{{.Example}}{{end}}{{if .HasAvailableSubCommands}}{{$cmds := .Commands}}{{if eq (len .Groups) 0}}

Available Commands:{{range $cmds}}{{if .IsAvailableCommand}}
  {{rpad .Name .NamePadding }} {{.Short}}{{end}}{{end}}{{else}}{{range $group := .Groups}}

{{.Title}}{{range $cmds}}{{if (and (eq .GroupID $group.ID) .IsAvailableCommand)}}
  {{rpad .Name .NamePadding }} {{.Short}}{{end}}{{end}}{{end}}{{if not .AllChildCommandsHaveGroup}}

Additional Commands:{{range $cmds}}{{if (and (eq .GroupID "") .IsAvailableCommand)}}
  {{rpad .Name .NamePadding }} {{.Short}}{{end}}{{end}}{{end}}{{end}}{{end}}{{if .HasAvailableLocalFlags}}

Flags:
{{.LocalFlags.FlagUsages | trimTrailingWhitespaces}}{{end}}{{if .HasAvailableInheritedFlags}}

Global Flags:
{{.InheritedFlags.FlagUsages | trimTrailingWhitespaces}}{{end}}{{if .HasHelpSubCommands}}

Additional help topics:{{range .Commands}}{{if .IsAdditionalHelpTopicCommand}}
  {{rpad .CommandPath .CommandPathPadding}} {{.Short}}{{end}}{{end}}{{end}}{{if .HasAvailableSubCommands}}

Use "{{.CommandPath}} [command] --help" for more information about a command.{{end}}
`)
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "\033[1;31m[ERROR]\033[0m %v\n", err)
		os.Exit(1)
	}
}

// CheckSudoRequirements verifies that the user is root if the command requires it
func CheckSudoRequirements(cmdName string, needSudo bool) {
	if needSudo && os.Geteuid() != 0 {
		utils.LogWarning("The command '%s' requires root privileges.", cmdName)
		utils.LogNormal("Run: sudo coa %s", cmdName)
		os.Exit(1)
	}
}
