package cmd

import (
	"coa/pkg/krill" // <-- Aggiungi l'import del tuo nuovo pacchetto Krill
	"coa/pkg/utils"
	"os"

	"github.com/spf13/cobra"
)

// krillSubCmd definisce il sottocomando 'coa sysinstall krill'
var krillSubCmd = &cobra.Command{
	Use:   "krill",
	Short: "Lancia l'installatore testuale Krill (TUI)",
	Run: func(cmd *cobra.Command, args []string) {
		// Manteniamo la coerenza dei permessi, installare un sistema richiede root
		CheckSudoRequirements("sysinstall krill", true)

		runKrillInstaller()
	},
}

// runKrillInstaller prepara la configurazione e avvia il motore Bubble Tea.
func runKrillInstaller() {
	// Pipeline unica di preparazione (condivisa con Calamares):
	// Krill leggerà la configurazione generata in /etc/oa-tools.d/installer.d/
	if err := prepareInstallerEnvironment(AppVersion); err != nil {
		utils.LogError("%v", err)
		os.Exit(1)
	}

	utils.LogNormal("%s[Krill]%s Avvio dell'installatore TUI in corso...", utils.ColorCyan, utils.ColorReset)

	// Invochiamo la vera interfaccia Go!
	if err := krill.Run(); err != nil {
		utils.LogNormal("%s[Krill Errore]%s L'installazione è stata interrotta: %v", utils.ColorRed, utils.ColorReset, err)
		os.Exit(1)
	}

	utils.LogNormal("%s[Krill]%s Uscita dall'installer.", utils.ColorGreen, utils.ColorReset)
	os.Exit(0)
}

func init() {
	// Appendiamo il comando a sysinstallCmd
	sysinstallCmd.AddCommand(krillSubCmd)
}
