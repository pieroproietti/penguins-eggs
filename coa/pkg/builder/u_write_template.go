package builder

import (
	"fmt"
	"os"
	"text/template"
)

func writeTemplate(tmplPath string, destPath string, data RecipeData) error {
	// 1. Parse the template file
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return fmt.Errorf("unable to read template %s: %w", tmplPath, err)
	}

	// 2. Create/overwrite the destination file
	f, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("unable to create destination file %s: %w", destPath, err)
	}
	defer f.Close()

	// 3. Substitution (write the content)
	err = tmpl.Execute(f, data)
	if err != nil {
		return fmt.Errorf("error generating template %s: %w", tmplPath, err)
	}

	// 4. Sync (ensure data is physically written to disk)
	err = f.Sync()
	if err != nil {
		return fmt.Errorf("error syncing file %s: %w", destPath, err)
	}

	return nil
}
