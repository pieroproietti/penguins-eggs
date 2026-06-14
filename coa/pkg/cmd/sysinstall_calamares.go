package cmd

import (
	"coa/pkg/sysinstall/calamares"
	"coa/pkg/sysinstall/setup"
	"coa/pkg/utils"
	"os"

	"github.com/spf13/cobra"
)

var calamaresSubCmd = &cobra.Command{
	Use:   "calamares",
	Short: "Lancia l'installatore grafico Calamares",
	Run: func(cmd *cobra.Command, args []string) {
		// Verifichiamo i permessi prima di tutto
		CheckSudoRequirements("sysinstall calamares", true)

		// 👈 LA SOLUZIONE È QUI: Passiamo la tua variabile globale!
		RunCalamaresInstaller(AppVersion)
	},
}

// RunCalamaresInstaller coordina la preparazione e il lancio di Calamares
func RunCalamaresInstaller(oaVersion string) {
	// 1. Pipeline unica di preparazione (condivisa con Krill)
	if err := prepareInstallerEnvironment(oaVersion); err != nil {
		utils.LogError("%v", err)
		os.Exit(1)
	}

	// 2. qmlSymlink: serve solo all'interfaccia grafica
	if err := calamares.QmlSymlink(); err != nil {
		utils.LogError("Errore creazione link QML: %v", err)
	}

	// 3. LAUNCH: Calamares parte e trova la pappa pronta
	if err := setup.Launch(); err != nil {
		utils.LogError("L'installatore si è chiuso con un errore: %v", err)
	}
}

func init() {
	// Appendiamo questo comando a sysinstallCmd
	sysinstallCmd.AddCommand(calamaresSubCmd)
}
