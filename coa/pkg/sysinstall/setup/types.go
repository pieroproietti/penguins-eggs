package setup

import "coa/pkg/pathDefaults"

// Costanti globali del pacchetto calamares
const (
	InstallerDRoot = "/etc/oa-tools.d/installer.d/"
	modulesDir     = InstallerDRoot + "/modules"
)

var stagingDir = pathDefaults.StagingDir
