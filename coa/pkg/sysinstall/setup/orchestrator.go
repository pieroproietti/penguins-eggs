package setup

import (
	"coa/pkg/distro"
	"coa/pkg/utils"
)

// buildInstaller coordina la costruzione della directory di Calamares
func buildInstaller(oaVersion string) error {
	// 1. Inizializza il workspace
	if err := initWorkspace(); err != nil {
		return err
	}

	d := distro.NewDistro()
	utils.LogNormal("Generazione moduli e payload in corso...")

	// 2. IL LINK QML! Fatto qui, è blindato.
	if err := QmlSymlink(); err != nil {
		return err
	}

	// 2. Chiamata in cascata agli Stampatori e ai Payload
	tasks := []func() error{
		func() error { return brandingDesc(oaVersion) },
		func() error { return bootloaderScripts(d) },
		partitionConf,
		mountConf,
		userConf,
		displaymanagerConf,
		removeuserConf,
		unpackfsConf,
		shellprocessBootloaderBridge,
	}

	for _, task := range tasks {
		if err := task(); err != nil {
			utils.LogError("Fallimento modulo: %v", err)
			return err
		}
	}

	return nil
}
