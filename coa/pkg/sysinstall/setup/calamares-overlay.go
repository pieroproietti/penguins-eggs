package setup

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

var calamaresModulesBranding = "/etc/penguins-eggs.d/branding/calamares/modules"

// calamaresModulesOverlay applies module configuration supplied by a costume.
// Atelier files use a .yaml suffix, while Calamares expects .conf in installer.d.
func calamaresModulesOverlay() error {
	entries, err := os.ReadDir(calamaresModulesBranding)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("unable to read Calamares module branding: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || (filepath.Ext(entry.Name()) != ".yaml" && filepath.Ext(entry.Name()) != ".conf") {
			continue
		}

		data, err := os.ReadFile(filepath.Join(calamaresModulesBranding, entry.Name()))
		if err != nil {
			return fmt.Errorf("unable to read Calamares module override %s: %w", entry.Name(), err)
		}
		name := strings.TrimSuffix(entry.Name(), filepath.Ext(entry.Name())) + ".conf"
		if err := os.WriteFile(filepath.Join(modulesDir, name), data, 0644); err != nil {
			return fmt.Errorf("unable to install Calamares module override %s: %w", entry.Name(), err)
		}
	}

	return nil
}
