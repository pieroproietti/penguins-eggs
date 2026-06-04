package cmd

import (
	"os"

	"coa/pkg/builder"
	"coa/pkg/distro"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var buildCmd = &cobra.Command{
	Use:   "build",
	Short: "Compile binaries and generate native distribution packages (.deb, PKGBUILD)",
	Long: `The 'build' command is the integrated packaging tool for the coa/oa ecosystem.
It orchestrates the full compilation of both the C-native engine (oa) and the Go-based orchestrator (coa), triggers the automatic generation of documentation and shell completions, and finally packages everything into native distribution formats like .deb (Debian/Ubuntu) or PKGBUILD (Arch Linux).`,
	Example: `  # Compile the ecosystem and generate native packages
  coa tools build`,
	Run: func(cmd *cobra.Command, args []string) {
		// Controllo Anti-Sudo: blocchiamo l'esecuzione se l'utente è root
		if os.Geteuid() == 0 {
			utils.Fatal(" Esecuzione interrotta. NON eseguire 'coa tools build' con sudo!")
			utils.LogNormal("La compilazione deve essere effettuata come utente normale per evitare di " +
				"creare file e pacchetti di proprietà di root nel tuo workspace.")
			os.Exit(1)
		}

		// Rileva la distribuzione host (i Sensi)
		myDistro := distro.NewDistro()

		// Passa la palla al motore di build, includendo la versione di Git
		builder.HandleBuild(myDistro)
	},
}

func init() {
	toolsCmd.AddCommand(buildCmd)
}
