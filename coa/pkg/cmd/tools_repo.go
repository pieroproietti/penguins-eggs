package cmd

import (
	"os"

	"coa/pkg/repo"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var toolsRepoCmd = &cobra.Command{
	Use:   "repo [add|rm]",
	Short: "Adds or removes the official penguins-eggs repository",
	Long: `Configure the host system's package manager (APT, Pacman, DNF, Zypper, APK) 
to download packages from the official penguins-eggs.net repository.

Supported actions:
  add - Install the GPG keys and add the repository
  rm  - Removes repository files and GPG keys`,
	Example: `  sudo coa tools repo add
  sudo coa tools repo rm`,
	Args:      cobra.ExactArgs(1),
	ValidArgs: []string{"add", "rm"},
	Run: func(cmd *cobra.Command, args []string) {
		action := args[0]

		if action != "add" && action != "rm" && action != "remove" {
			utils.LogError("Invalid action: '%s'. Use 'add' or 'rm'.", action)
			os.Exit(1)
		}

		if os.Geteuid() != 0 {
			utils.Fatal(" The repo command must be run as root (sudo).")
			os.Exit(1)
		}

		if err := repo.HandleRepos(action); err != nil {
			utils.LogError("Operation failed: %v", err)
			os.Exit(1)
		}

		utils.LogSuccess("Repository configuration completed successfully.")
	},
}

func init() {
	toolsCmd.AddCommand(toolsRepoCmd)
}
