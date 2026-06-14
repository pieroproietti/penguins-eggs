package setup

import (
	"path/filepath"
)

// Definiamo una struct dedicata per il template
type RemoveUserConfig struct {
	Username string
}

func removeuserConf() error {
	config := RemoveUserConfig{
		Username: "live", // Il tuo standard per l'uovo
	}

	targetPath := filepath.Join(InstallerDRoot, "modules", "removeuser.conf")

	// Ora usa il motore unificato
	return renderAndSaveEmbedded("removeuser.conf.tmpl", targetPath, config, 0644)
}
