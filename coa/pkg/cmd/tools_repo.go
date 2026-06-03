package cmd

import (
	"fmt"
	"os"

	"coa/pkg/repo" // Assicurati che il path sia corretto

	"github.com/spf13/cobra"
)

var toolsRepoCmd = &cobra.Command{
	Use:   "repo [add|rm]",
	Short: "Aggiunge o rimuove il repository ufficiale di penguins-eggs",
	Long: `Configura il gestore pacchetti del sistema host (APT, Pacman, DNF, Zypper, APK) 
per scaricare i pacchetti dalla repository ufficiale di penguins-eggs.net.

Azioni supportate:
  add - Installa le chiavi GPG e aggiunge il repository
  rm  - Rimuove i file del repository e le chiavi GPG`,
	Example: `  sudo coa tools repo add
  sudo coa tools repo rm`,
	Args:      cobra.ExactArgs(1),    // Richiede esattamente 1 argomento
	ValidArgs: []string{"add", "rm"}, // Suggeriamo solo 'rm' per l'autocompletamento
	Run: func(cmd *cobra.Command, args []string) {
		action := args[0]

		// Valida l'azione (accettiamo 'remove' come alias silenzioso per retrocompatibilità/abitudine)
		if action != "add" && action != "rm" && action != "remove" {
			fmt.Printf("\033[1;31m[ERRORE]\033[0m Azione non valida: '%s'. Usa 'add' o 'rm'.\n", action)
			os.Exit(1)
		}

		// Controllo root: toccare i repository richiede i privilegi massimi
		if os.Geteuid() != 0 {
			fmt.Println("\033[1;31m[ERRORE]\033[0m Il comando repo deve essere eseguito come root (sudo).")
			os.Exit(1)
		}

		// Passiamo il controllo al modulo repo che gestirà il routing in base alla distro
		if err := repo.HandleRepos(action); err != nil {
			fmt.Printf("\033[1;31m[ERRORE]\033[0m Operazione fallita: %v\n", err)
			os.Exit(1)
		}

		// Messaggio di chiusura a colori (il dettaglio viene già stampato da pkg/repo)
		fmt.Println("\033[1;32m[SUCCESS]\033[0m Configurazione repository completata con successo.")
	},
}

func init() {
	toolsCmd.AddCommand(toolsRepoCmd)
}
