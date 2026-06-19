package builder

import (
	"fmt"
	"os"
	"text/template"
)

func writeTemplate(tmplPath string, destPath string, data RecipeData) error {
	// 1. Parsing del file template
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return fmt.Errorf("unable to read template %s: %w", tmplPath, err)
	}

	// 2. Creazione/Sovrascrittura del file di destinazione
	f, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("unable to create destination file %s: %w", destPath, err)
	}
	defer f.Close()

	// 3. sostituzione (Scrittura del contenuto)
	err = tmpl.Execute(f, data)
	if err != nil {
		return fmt.Errorf("error generating template %s: %w", tmplPath, err)
	}

	// 4. Sincronizzazione (Assicura che i dati siano scritti fisicamente sul disco)
	err = f.Sync()
	if err != nil {
		return fmt.Errorf("error syncing file %s: %w", destPath, err)
	}

	return nil
}
