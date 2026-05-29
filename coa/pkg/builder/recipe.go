package builder

import (
	sysctx "coa/pkg/context"
	"fmt"
	"os"
	"path/filepath"
)

// addBuildRecipe scrive il file di controllo (PKGBUILD, SPEC, ecc.)
// dentro la directory di staging preparata dal "Facchino".
func recipe(ctx sysctx.RuntimeContext, stage, dist string, data RecipeData) {
	fmt.Printf("[build] Recipe: scrivo la ricetta per %s...\n", dist)

	switch dist {
	case "alpine":
		writeAPKBUILD(stage, data)

	case "arch", "manjaro":
		writePKGBUILD(ctx, stage, dist, data)

	case "fedora", "opensuse":
		writeSpecFile(ctx, stage, dist, data)

	default:
		writeDebianFiles(ctx, stage, data)
	}
}

// Esempi di funzioni di scrittura (da espandere con i tuoi template)
func writePKGBUILD(ctx sysctx.RuntimeContext, stage string, dist string, data RecipeData) error {
	// 1. Costruiamo il nome del file template dinamicamente (es. "arch.tmpl" o "manjaro.tmpl")
	tmplName := fmt.Sprintf("%s.tmpl", dist)

	// Il percorso punterà direttamente a coa/pkg/builder/templates/arch.tmpl
	tmplPath := filepath.Join(ctx.ProjRoot, "coa/pkg/builder/templates", tmplName)

	// 2. Destinazione: nella root dello stage e DEVE chiamarsi esattamente "PKGBUILD"
	destPath := filepath.Join(stage, "PKGBUILD")

	fmt.Printf("[Recipe] --> Scrittura template: %s -> %s\n", tmplName, destPath)

	// 3. Eseguiamo la fusione
	return writeTemplate(tmplPath, destPath, data)
}

func writeSpecFile(ctx sysctx.RuntimeContext, stage string, dist string, data RecipeData) error {
	// 1. Costruiamo il nome del file template dinamicamente (es. "fedora.tmpl" o "opensuse.tmpl")
	tmplName := fmt.Sprintf("%s.tmpl", dist)

	// Il percorso punterà direttamente a coa/pkg/builder/templates/arch.tmpl
	tmplPath := filepath.Join(ctx.ProjRoot, "coa/pkg/builder/templates", tmplName)

	// Il file di destinazione per RPM si chiama convenzionalmente col nome del pacchetto
	destPath := filepath.Join(stage, "oa-tools.spec")

	// 2. Eseguiamo la fusione tramite la tua funzione di appoggio
	return writeTemplate(tmplPath, destPath, data)
}

func writeAPKBUILD(stage string, data RecipeData) {
	fmt.Println(data)
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
