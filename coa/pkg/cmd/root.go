package cmd

import (
	"coa/pkg/utils"
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

// AppVersion viene iniettata dal Makefile durante il build
var AppVersion = "development"

// rootCmd rappresenta il comando base quando viene chiamato senza argomenti
var rootCmd = &cobra.Command{
	Use:   "coa",
	Short: "coa - Calamares & OA Lightweight Architect",
	Long: `coa è l'orchestratore universale per penguins-eggs.
Progettato per essere leggero ed elegante, legge la logica specifica 
delle distribuzioni dal Brain e pilota il motore OA per 
la rimasterizzazione e l'installazione del sistema.`,
	Version: AppVersion,
}

// Execute aggiunge tutti i comandi figli al comando radice e imposta i flag correttamente.
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
		fmt.Fprintf(os.Stderr, "\033[1;31m[ERRORE]\033[0m %v\n", err)
		os.Exit(1)
	}
}

// CheckSudoRequirements verifica che l'utente sia root se il comando lo richiede
func CheckSudoRequirements(cmdName string, needSudo bool) {
	if needSudo && os.Geteuid() != 0 {
		utils.LogWarning("Il comando '%s' richiede privilegi di root.", cmdName)
		utils.LogNormal("Esegui: sudo coa %s", cmdName)
		os.Exit(1)
	}
}
