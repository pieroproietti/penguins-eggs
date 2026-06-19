package setup

import (
	"bytes"
	"embed"
	"fmt"
	"os"
	"text/template"
)

// BootloaderConfig contiene i dati da iniettare nei template
type BootloaderConfig struct {
	Family string
	ID     string
}

//go:embed template/*
var templateFS embed.FS

// helper interno per leggere da embed.FS, compilare il template e salvare
func renderAndSaveEmbedded(tmplName, outPath string, data interface{}, perm os.FileMode) error {
	tmplContent, err := templateFS.ReadFile("template/" + tmplName)

	if err != nil {
		return fmt.Errorf("unable to read template %s: %w", tmplName, err)
	}

	t, err := template.New(tmplName).Parse(string(tmplContent))
	if err != nil {
		return fmt.Errorf("error parsing template %s: %w", tmplName, err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return fmt.Errorf("error rendering template %s: %w", tmplName, err)
	}

	return os.WriteFile(outPath, buf.Bytes(), perm)
}
