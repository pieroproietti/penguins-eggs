package setup

import (
	"path/filepath"

	"coa/pkg/parser"
)

// configuredLiveUser returns the live username set via 'eggs config'
// (remaster.user in custom.yaml), falling back to the default "live".
func configuredLiveUser() string {
	if settings, err := parser.LoadCustomSettings(); err == nil && settings != nil && settings.Remaster.User != "" {
		return settings.Remaster.User
	}
	return "live"
}

// Definiamo una struct dedicata per il template
type RemoveUserConfig struct {
	Username string
}

func removeuserConf() error {
	config := RemoveUserConfig{
		Username: configuredLiveUser(),
	}

	targetPath := filepath.Join(InstallerDRoot, "modules", "removeuser.conf")

	// Ora usa il motore unificato
	return renderAndSaveEmbedded("removeuser.conf.tmpl", targetPath, config, 0644)
}
