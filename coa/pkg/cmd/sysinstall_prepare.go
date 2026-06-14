package cmd

import (
	"fmt"

	"coa/pkg/sysinstall/setup"
	"coa/pkg/utils"
)

// prepareInstallerEnvironment esegue la pipeline unica di preparazione:
// carica il profilo e genera la configurazione completa dell'installer
// in /etc/oa-tools.d/installer.d/.
// È il "punto finale della configurazione": da qui in poi Calamares e
// Krill leggono esattamente gli stessi file.
func prepareInstallerEnvironment(oaVersion string) error {
	utils.LogNormal("%s[sysinstall]%s Preparazione motori...", utils.ColorCyan, utils.ColorReset)

	// 1. Fase di setup (Pulisce /etc, estrae asset)
	if err := setup.Run(oaVersion); err != nil {
		return fmt.Errorf("errore setup ambiente installer: %v", err)
	}

	// 2. Fase Preparazione (Scrive gli script in /tmp/coa)
	// setup.Run()

	return nil
}
