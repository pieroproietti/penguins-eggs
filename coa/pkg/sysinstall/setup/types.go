package setup

import "coa/pkg/pathDefaults"

// Variabili globali del pacchetto calamares
var (
	InstallerDRoot = "/etc/penguins-eggs.d/installer.d/"
	modulesDir     = InstallerDRoot + "/modules"
)

var stagingDir = pathDefaults.StagingDir
