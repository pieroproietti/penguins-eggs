package cmd

import (
	"coa/pkg/sysinstall/krill" // <-- Aggiungi l'import del tuo nuovo pacchetto Krill
	"coa/pkg/sysinstall/setup"
	"coa/pkg/utils"
	"os"

	"github.com/spf13/cobra"
)

var krillUnattended bool

// krillSubCmd definisce il sottocomando 'coa sysinstall krill'
var krillSubCmd = &cobra.Command{
	Use:   "krill",
	Short: "Lancia l'installatore testuale Krill (TUI)",
	Run: func(cmd *cobra.Command, args []string) {
		// Manteniamo la coerenza dei permessi, installare un sistema richiede root
		CheckSudoRequirements("sysinstall krill", true)

		runKrillInstaller(AppVersion, krillUnattended)
	},
}

// runKrillInstaller prepara la configurazione e avvia Krill (TUI o unattended).
func runKrillInstaller(oaVersion string, unattended bool) {
	if err := setup.BuildInstaller(oaVersion); err != nil {
		utils.LogError("Errore setup ambiente installer: %v", err)
		os.Exit(1)
	}

	if unattended {
		if err := krill.RunUnattended(); err != nil {
			utils.LogError("Installazione unattended fallita: %v", err)
			os.Exit(1)
		}
		utils.LogNormal("%s[Krill]%s Installazione unattended completata.", utils.ColorGreen, utils.ColorReset)
		os.Exit(0)
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
	krillSubCmd.Flags().BoolVar(&krillUnattended, "unattended", false,
		"installazione non interattiva con i default (ATTENZIONE: cancella il primo disco)")
	// Appendiamo il comando a sysinstallCmd
	sysinstallCmd.AddCommand(krillSubCmd)
}
