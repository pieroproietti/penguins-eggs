package builder

import (
	sysctx "coa/pkg/context"
	"fmt"
	"os"
	"path/filepath"
)

// CreateDefaultYAML genera il file di configurazione oa-tools.yaml di default.
// Viene richiamata da HandleBuild appena prima di lanciare i pack specifici.
func CreateDefaultYAML(ctx sysctx.RuntimeContext, fullVersion string) error {
	// Usiamo ProjRoot in modo che finisca fisicamente in ~/oa-tools/etc/oa-tools.d/
	// da dove i vari PKGBUILD e costruttori Debian se lo aspettano.
	confDest := filepath.Join(ctx.ProjRoot, "etc", "oa-tools.d")
	LogBuild("Creating custom.yaml on: %s", confDest)

	// Indentazione rifatta con SPAZI PURI ASCII. Non usare Tab o NBSP!
	oaYamlContent := fmt.Sprintf(`---
# oa-tools v%s configurations

remaster:
  # You MUST NOT change the default live user
  # user: "live"

  # You can set a custom password for the live session
  password: "evolution"

  # You can adjust compression settings to maximize space saving
  compression:
    # Options: zstd, xz, lz4, gzip
    algorithm: "zstd"
    # Level: for zstd use 1-19 (15 is the sweet spot for size/speed)
    level: 3
`, fullVersion)

	// Creazione sicura dell'albero di directory (es. se "etc" o "oa-tools.d" non esistono)
	if err := os.MkdirAll(confDest, 0755); err != nil {
		return fmt.Errorf("creazione directory %s fallita: %v", confDest, err)
	}

	// Scrittura del file
	targetFile := filepath.Join(confDest, "custom.yaml")
	if err := os.WriteFile(targetFile, []byte(oaYamlContent), 0644); err != nil {
		return fmt.Errorf("scrittura %s fallita: %v", targetFile, err)
	}

	return nil
}
