package setup

import (
	"bytes"
	"coa/pkg/distro"
	"embed"
	"fmt"
	"os"
	"path/filepath"
	"text/template"
)

//go:embed template/*
var templateFS embed.FS

// BootloaderConfig contiene i dati da iniettare nei template
type BootloaderConfig struct {
	Family string
	ID     string
}

// helper interno per leggere da embed.FS, compilare il template e salvare
func renderAndSaveEmbedded(tmplName, outPath string, data interface{}, perm os.FileMode) error {
	// Leggiamo il file template direttamente dal file system virtuale "embed"
	tmplContent, err := templateFS.ReadFile("template/" + tmplName)
	if err != nil {
		return fmt.Errorf("impossibile leggere il template %s: %w", tmplName, err)
	}

	t, err := template.New(tmplName).Parse(string(tmplContent))
	if err != nil {
		return fmt.Errorf("errore parsing template %s: %w", tmplName, err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return fmt.Errorf("errore rendering template %s: %w", tmplName, err)
	}

	return os.WriteFile(outPath, buf.Bytes(), perm)
}

// bootloader genera i file necessari alla finalizzazione del sistema in staging (/tmp/coa)
func bootloader(d *distro.Distro, stagingDir string) error {
	if err := os.MkdirAll(stagingDir, 0755); err != nil {
		return err
	}

	config := BootloaderConfig{
		Family: d.FamilyID,
		ID:     d.DistroID,
	}

	// 1. Genera oa-bootloader.sh
	outBootloader := filepath.Join(stagingDir, "oa-bootloader.sh")
	if err := renderAndSaveEmbedded("bootloader.sh.tmpl", outBootloader, config, 0755); err != nil {
		return err
	}

	// 2. Genera oa-prepare-target.sh
	outBridge := filepath.Join(stagingDir, "oa-prepare-target.sh")
	if err := renderAndSaveEmbedded("bridge.sh.tmpl", outBridge, nil, 0755); err != nil {
		return err
	}

	// 3. Genera shellprocess_oa_bootloader.conf
	outModule := filepath.Join(stagingDir, "shellprocess_oa_bootloader.conf")
	if err := renderAndSaveEmbedded("shellprocess.conf.tmpl", outModule, nil, 0644); err != nil {
		return err
	}

	return nil
}
