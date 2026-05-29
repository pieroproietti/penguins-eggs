package builder

import (
	sysctx "coa/pkg/context"
	"fmt"
	"os"
	"path/filepath"
)

// addBuildRecipe scrive il file di controllo (PKGBUILD, SPEC, ecc.)
// dentro la directory di staging preparata dal "Facchino".
func addBuildRecipe(ctx sysctx.RuntimeContext, stage string, dist string, data RecipeData) {
	fmt.Printf("[build] Sarto: scrivo la ricetta per %s...\n", dist)

	switch dist {
	case "archlinux", "manjaro":
		writePKGBUILD(stage, data)
	case "fedora":
		writeSpecFile(stage, data)
	case "alpine":
		writeAPKBUILD(stage, data)
	default:
		writeDebianFiles(ctx, stage, data)
	}
}

// Esempi di funzioni di scrittura (da espandere con i tuoi template)
func writePKGBUILD(stage string, data RecipeData) {
	fmt.Printf("[TODO] Implementare writePKGBUILD per lo stage: %s\n", stage)
}

func writeSpecFile(stage string, data RecipeData) error {
	fmt.Printf("[TODO] Implementare writeSpecFile per lo stage: %s\n", stage)
	return nil
}

func writeAPKBUILD(stage string, data RecipeData) {
	fmt.Printf("[TODO] Implementare writeAPKBUILD per lo stage: %s\n", stage)
}

func writeDebianFiles(ctx sysctx.RuntimeContext, stage string, data RecipeData) error {
	debianDir := filepath.Join(stage, "DEBIAN")

	// Assicuriamo che la cartella esista
	os.MkdirAll(debianDir, 0755)

	// Mappa template -> destinazione
	files := map[string]string{
		"control.tmpl":   "control",
		"rules.tmpl":     "rules",
		"compat.tmpl":    "compat",
		"copyright.tmpl": "copyright",
		"changelog.tmpl": "changelog",
	}

	for tmplName, destName := range files {
		tmplPath := filepath.Join(ctx.ProjRoot, "coa/pkg/builder/templates/debian", tmplName)
		destPath := filepath.Join(debianDir, destName)

		// Feedback a video per il manutentore
		fmt.Printf("--> Scrittura template: %s -> %s\n", tmplName, destPath)

		// Usiamo direttamente 'data' che contiene BaseVersion, Rel e Date
		err := writeTemplate(tmplPath, destPath, data)
		if err != nil {
			return err
		}
	}
	return nil
}
