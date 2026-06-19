package cmd

import (
	"os"

	"coa/pkg/repo" // Assicurati che il path sia corretto
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
	Args:      cobra.ExactArgs(1),    // Richiede esattamente 1 argomento
	ValidArgs: []string{"add", "rm"}, // Suggeriamo solo 'rm' per l'autocompletamento
	Run: func(cmd *cobra.Command, args []string) {
		action := args[0]

		// Valida l'azione (accettiamo 'remove' come alias silenzioso per retrocompatibilità/abitudine)
		if action != "add" && action != "rm" && action != "remove" {
			utils.LogError("Azione non valida: '%s'. Usa 'add' o 'rm'.", action)
			os.Exit(1)
		}

		// Controllo root: toccare i repository richiede i privilegi massimi
		if os.Geteuid() != 0 {
			utils.Fatal(" Il comando repo deve essere eseguito come root (sudo).")
			os.Exit(1)
		}

		// Passiamo il controllo al modulo repo che gestirà il routing in base alla distro
		if err := repo.HandleRepos(action); err != nil {
			utils.LogError("Operazione fallita: %v", err)
			os.Exit(1)
		}

		// Messaggio di chiusura a colori (il dettaglio viene già stampato da pkg/repo)
		utils.LogSuccess("Configurazione repository completata con successo.")
	},
}

func init() {
	toolsCmd.AddCommand(toolsRepoCmd)
}
