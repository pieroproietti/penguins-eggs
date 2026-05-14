package cmd

import (
	"coa/pkg/calamares"
	"coa/pkg/pilot"
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
// 👈 CORRETTO: rimossa la parentesi di troppo alla fine
func RunCalamaresInstaller(oaVersion string) {
	utils.LogCoala("%s[sysinstall]%s Preparazione motori...", utils.ColorCyan, utils.ColorReset)

	// 1. Caricamento del profilo tramite il Pilot
	profile, err := pilot.DetectAndLoad()
	if err != nil {
		utils.LogError("Impossibile caricare il profilo: %v", err)
		os.Exit(1)
	}

	// 2. Fase Preparazione (Scrive gli script in /tmp/coa)
	if err := calamares.SetupOABootloader(profile); err != nil {
		utils.LogError("Errore preparazione script: %v", err)
		return
	}

	// 3. Fase di setuto (Pulisce /etc, estrae asse)
	if err := calamares.Setup(); err != nil {
		utils.LogError("Calamares ha riscontrato un problema: %v", err)
		return
	}

	// 4. Configurazione DINAMICA
	// partition.conf
	if err := calamares.PreparePartitionConf(); err != nil {
		utils.LogError("Errore configurazione partition.conf: %v", err)
	}

	// users.conf
	if err := calamares.PrepareUserConf(); err != nil {
		utils.LogError("Errore configurazione users.conf: %v", err)
	}

	// displaymanager.conf
	if err := calamares.PrepareDisplaymanagerConf(); err != nil {
		utils.LogError("Errore configurazione displaymanager.conf: %v", err)
	}

	// removeusers.conf
	if err := calamares.PrepareRemoveuserConf(); err != nil {
		utils.LogError("Errore creazione removeuser.conf: %v", err)
	}

	// branding.desc
	if err := calamares.PrepareBrandingDesc(oaVersion); err != nil {
		utils.LogError("Errore creazione branding.desc: %v", err)
	}

	// qmlSymlink
	if err := calamares.PrepareQmlSymlink(); err != nil {
		utils.LogError("Errore creazione link QML: %v", err)
	}

	// 5. LAUNCH: Calamares parte e trova la pappa pronta
	if err := calamares.Launch(); err != nil {
		utils.LogError("L'installatore si è chiuso con un errore: %v", err)
	}
}

func init() {
	// Appendiamo questo comando a sysinstallCmd
	sysinstallCmd.AddCommand(calamaresSubCmd)
}
