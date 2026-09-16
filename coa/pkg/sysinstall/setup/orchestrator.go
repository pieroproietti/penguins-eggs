package setup

import (
	"fmt"
	"os/exec"
	"path/filepath"

	"coa/pkg/parser"
	"coa/pkg/utils"
)

// buildInstaller coordina la costruzione della directory di Calamares
func BuildInstaller(oaVersion string) error {
	// Resolve the source once for both identity and unpackfs configuration.
	source := FindSquashfsPath()
	if source == ErrorSquashfsNotFound {
		if !utils.IsLive() {
			return fmt.Errorf("live squashfs image not found (%s). On an installed system, run 'sudo eggs remaster' first to create the ISO image to install", source)
		}
		return fmt.Errorf("live squashfs image not found: %s", source)
	}

	// 1. Carica il profilo dal planner (brain)
	profile, err := parser.DetectAndLoad(false)
	if err != nil {
		return err
	}

	sibling, err := readSourceSibling(source)
	if err != nil {
		return err
	}
	if err := initWorkspace(); err != nil {
		return err
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
		removeuserConf,
		shellprocessOaChrootRunner,
		machineIdConf,
		calamaresModulesOverlay,
		func() error { return unpackfsConf(source) },
	}

	for _, task := range tasks {
		if err := task(); err != nil {
			utils.LogError("Module failure: %v", err)
			return err
		}
	}

	return configureSourceUsers(filepath.Join(InstallerDRoot, "settings.conf"), sibling)
}
