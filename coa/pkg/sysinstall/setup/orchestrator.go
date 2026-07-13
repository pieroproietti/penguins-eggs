package setup

import (
	"os/exec"
	"path/filepath"

	"coa/pkg/parser"
	"coa/pkg/utils"
)

// buildInstaller coordina la costruzione della directory di Calamares
func BuildInstaller(oaVersion string) error {
	// 1. Carica il profilo dal planner (brain)
	profile, err := parser.DetectAndLoad(false)
	if err != nil {
		return err
	}

	// 1.1. Inizializza il workspace
	if err := initWorkspace(); err != nil {
		return err
	}

	// 1.2. Se il sistema è stato remasterizzato in clone/crypted, gli
	// utenti sono già clonati da /home: togliamo "users" dalla sequence
	// condivisa prima che Calamares o Krill la leggano.
	if mode := readSibling().Mode; mode == "clone" || mode == "crypted" {
		utils.LogNormal("[INSTALLER] Mode '%s': users already cloned, removing 'users' step from settings.conf.", mode)
		if err := stripUsersModule(filepath.Join(InstallerDRoot, "settings.conf")); err != nil {
			return err
		}
	}

	utils.LogNormal("Generating modules and payload...")

	// 2. IL LINK QML! Fatto qui, è blindato — solo se Calamares è installato.
	if _, err := exec.LookPath("calamares"); err == nil {
		if err := QmlSymlink(); err != nil {
			return err
		}
	}

	// 3. Chiamata in cascata agli Stampatori e ai Payload
	tasks := []func() error{
		func() error { return brandingDesc(oaVersion) },
		func() error { return generateChrootRunner(profile) },
		partitionConf,
		mountConf,
		userConf,
		displaymanagerConf,
		removeuserConf,
		unpackfsConf,
		shellprocessOaChrootRunner,
		machineIdConf,
	}

	for _, task := range tasks {
		if err := task(); err != nil {
			utils.LogError("Module failure: %v", err)
			return err
		}
	}

	return nil
}

