package cmd

import (
	"fmt"

	"coa/pkg/calamares"
	"coa/pkg/parser"
	"coa/pkg/utils"
)

// prepareInstallerEnvironment esegue la pipeline unica di preparazione:
// carica il profilo e genera la configurazione completa dell'installer
// in /etc/oa-tools.d/installer.d/.
// È il "punto finale della configurazione": da qui in poi Calamares e
// Krill leggono esattamente gli stessi file.
func prepareInstallerEnvironment(oaVersion string) error {
	utils.LogNormal("%s[sysinstall]%s Preparazione motori...", utils.ColorCyan, utils.ColorReset)

	// 1. Caricamento del profilo tramite il parser
	IsGitHubAction := false
	profile, err := parser.DetectAndLoad(IsGitHubAction)
	if err != nil {
		return fmt.Errorf("impossibile caricare il profilo: %v", err)
	}

	// 2. Fase Preparazione (Scrive gli script in /tmp/coa)
	if err := calamares.SetupOABootloader(profile); err != nil {
		return fmt.Errorf("errore preparazione script: %v", err)
	}

	// 3. Fase di setup (Pulisce /etc, estrae asset)
	if err := calamares.Setup(); err != nil {
		return fmt.Errorf("errore setup ambiente installer: %v", err)
	}

	// 4. Configurazione DINAMICA
	// partition.conf
	if err := calamares.PreparePartitionConf(); err != nil {
		utils.LogError("Errore configurazione partition.conf: %v", err)
	}

	// mount.conf
	if err := calamares.PrepareMountConf(); err != nil {
		utils.LogError("Errore configurazione mount.conf: %v", err)
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

	return nil
}
