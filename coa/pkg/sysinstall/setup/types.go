package setup

import "coa/pkg/config"

// Costanti globali del pacchetto calamares
const (
	InstallerDRoot = "/etc/oa-tools.d/installer.d/"
	modulesDir     = InstallerDRoot + "/modules"
)

var stagingDir = config.StagingDir
