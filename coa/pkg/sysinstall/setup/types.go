package setup

import "coa/pkg/pathDefaults"

// Costanti globali del pacchetto calamares
const (
	InstallerDRoot = "/etc/penguins-eggs.d/installer.d/"
	modulesDir     = InstallerDRoot + "/modules"
)

var stagingDir = pathDefaults.StagingDir
