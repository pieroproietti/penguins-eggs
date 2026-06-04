package builder

import (
	sysctx "coa/pkg/context"
	"coa/pkg/utils"
	"fmt"
	"os"
	"path/filepath"
)

// recipe: scrive il file di controllo (PKGBUILD, SPEC, ecc.) nello staging
func recipe(ctx sysctx.RuntimeContext, dist string, data RecipeData) {
	utils.LogNormal("[build] Recipe: scrivo la ricetta per %s...", dist)

	stage := ctx.StageDir

	switch dist {
	case "alpine":
		writeAPKBUILD(ctx, stage, data)

	case "arch", "manjaro":
		writePKGBUILD(ctx, stage, dist, data)

	case "fedora", "opensuse":
		writeSpecFile(ctx, stage, dist, data)

	default:
		writeDebianFiles(ctx, stage, data)
	}
}

// writeAPKBUILD scrive APKBUILD per alpine
func writeAPKBUILD(ctx sysctx.RuntimeContext, stage string, data RecipeData) error {
	// 1. Definiamo il percorso e nome del template
	tmplPath := filepath.Join(ctx.ProjRoot, "coa/pkg/builder/templates/alpine.tmpl")

	// 2. Destinazione: nella root dello stage e DEVE chiamarsi "APKBUILD"
	destPath := filepath.Join(stage, "APKBUILD")

	// 3. Eseguiamo la fusione dei dati
	return writeTemplate(tmplPath, destPath, data)
}

// writePKGBUILD scrive PKGBUILD per arch/manjaro
func writePKGBUILD(ctx sysctx.RuntimeContext, stage string, dist string, data RecipeData) error {
	// 1. Costruiamo il nome del file template (arch/manjaro) ed il percorso di origine
	tmplName := fmt.Sprintf("%s.tmpl", dist)
	tmplPath := filepath.Join(ctx.ProjRoot, "coa/pkg/builder/templates", tmplName)

	// 2. Destinazione: nella root dello stage e DEVE chiamarsi esattamente "PKGBUILD"
	destPath := filepath.Join(stage, "PKGBUILD")

	// 3. Eseguiamo la fusione
	return writeTemplate(tmplPath, destPath, data)
}

// writeSpecFile: scrive oa-tools.spec per fedora/opensuse
func writeSpecFile(ctx sysctx.RuntimeContext, stage string, dist string, data RecipeData) error {
	// 1. definiami il nome del template (fedora/opensuse)
	tmplName := fmt.Sprintf("%s.tmpl", dist)
	tmplPath := filepath.Join(ctx.ProjRoot, "coa/pkg/builder/templates", tmplName)

	// Il file di destinazione per RPM si chiama convenzionalmente col nome del pacchetto
	destPath := filepath.Join(stage, "oa-tools.spec")

	// 2. Eseguiamo la fusione tramite la tua funzione di appoggio
	return writeTemplate(tmplPath, destPath, data)
}

// writeDebianFiles: configura DEBIAN e crea control, rules, compat, copyright
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
		utils.LogNormal("--> Scrittura template: %s -> %s", tmplName, destPath)

		// Usiamo direttamente 'data' che contiene BaseVersion, Rel e Date
		err := writeTemplate(tmplPath, destPath, data)
		if err != nil {
			return err
		}
	}
	return nil
}
