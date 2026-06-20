package parser

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings" // <-- Aggiunto il pacchetto strings per l'indentazione
	"text/template"

	"coa/pkg/distro"
	"coa/pkg/utils"

	"github.com/spf13/viper" // Per gestire la configurazione
	"gopkg.in/yaml.v3"       // Per gestire lo YAML
)

// DetectAndLoad rileva il sistema e consulta l'index.yaml per trovare lo spartito corretto.
// Implementa il fallback tra ambiente di sviluppo locale e directory di sistema /etc.
func DetectAndLoad(isGitHubAction bool) (*Profile, error) {
	// 1. Identità: Chi siamo?
	myDistro := distro.NewDistro()

	// 2. Ricerca del percorso della configurazione (Dev vs System)
	var baseDir string
	pathsToTry := []string{
		filepath.Join("coa", "brain.d"), // Percorso di Sviluppo
		"/etc/oa-tools.d/brain.d",       // Percorso di Produzione
	}

	for _, path := range pathsToTry {
		if _, err := os.Stat(filepath.Join(path, "index.yaml")); err == nil {
			baseDir = path
			break
		}
	}

	if baseDir == "" {
		return nil, fmt.Errorf("no brain configuration found in expected paths")
	}

	indexPath := filepath.Join(baseDir, "index.yaml")

	// 3. Lettura e parsing dell'indice
	indexData, err := os.ReadFile(indexPath)
	if err != nil {
		return nil, fmt.Errorf("unable to read index %s: %v", indexPath, err)
	}

	var index BrainIndex
	if err := yaml.Unmarshal(indexData, &index); err != nil {
		return nil, fmt.Errorf("syntax error in index.yaml: %v", err)
	}

	// 4. Logica di Matching
	var moduleFile string
	for _, entry := range index.Distributions {
		if entry.ID == myDistro.DistroID {
			moduleFile = entry.File
			break
		}
		for _, l := range entry.Like {
			if l == myDistro.DistroID {
				moduleFile = entry.File
				break
			}
		}
		if moduleFile != "" {
			break
		}
	}

	if moduleFile == "" {
		return nil, fmt.Errorf("no module found for %s (ID: %s)", myDistro.DistroLike, myDistro.DistroID)
	}

	// =========================================================================
	// 5. RENDERING DEI TEMPLATE (La Nuova Architettura a 4 Pilastri)
	// =========================================================================
	basePath := filepath.Join(baseDir, "base.yaml.tmpl")

	// Assumiamo che i moduli siano nella sottocartella 'modules' e abbiano estensione .tmpl
	modulePath := filepath.Join(baseDir, "modules", moduleFile)

	// Log aggiornato per mostrare la quadrupla fusione
	utils.LogNormal("%s[parser]%s Compilazione: base.yaml.tmpl + %s", utils.ColorCyan, utils.ColorReset, moduleFile)

	// Context da passare al template
	ctx := TemplateContext{
		Family:         myDistro.FamilyID,
		DistroID:       myDistro.DistroID,
		IsGitHubAction: isGitHubAction,
	}

	// Creiamo un nuovo template base
	tmpl := template.New(filepath.Base(basePath))

	// Aggiungiamo le funzioni magiche "include" e "indent"
	tmpl.Funcs(template.FuncMap{
		"indent": func(spaces int, v string) string {
			pad := strings.Repeat(" ", spaces)
			// Indenta la prima riga e tutte le successive
			return pad + strings.ReplaceAll(v, "\n", "\n"+pad)
		},
		"include": func(name string, data interface{}) (string, error) {
			buf := new(bytes.Buffer)
			err := tmpl.ExecuteTemplate(buf, name, data)
			return buf.String(), err
		},
	})

	// 5.1 Parsiamo i file (Iniettiamo l'intero arsenale nel motore di Go)
	//_, err = tmpl.ParseFiles(scriptsPath, ellActionsPath, modulePath, basePath)
	_, err = tmpl.ParseFiles(basePath, modulePath)
	if err != nil {
		return nil, fmt.Errorf("error parsing templates: %v", err)
	}

	var rendered bytes.Buffer
	// Eseguiamo il template puntando esplicitamente al file base che farà da telaio
	if err := tmpl.ExecuteTemplate(&rendered, "base.yaml.tmpl", ctx); err != nil {
		return nil, fmt.Errorf("error rendering profile: %v", err)
	}

	// 6. Parsing dello YAML finale renderizzato
	var profile Profile
	if err := yaml.Unmarshal(rendered.Bytes(), &profile); err != nil {
		// SALVATAGGIO D'EMERGENZA: Scrive il file corrotto in /tmp per ispezionarlo
		os.WriteFile("/tmp/oa-failed-yaml.txt", rendered.Bytes(), 0644)
		return nil, fmt.Errorf("YAML syntax error (see /tmp/oa-failed-yaml.txt): %v", err)
	}

	// 7. DEFAULT + OVERRIDE
	profile.Settings.Remaster = defaultRemasterConfig()
	customCfg, err := LoadCustomSettings()
	if err != nil {
		return nil, fmt.Errorf("error loading custom.yaml: %v", err)
	}
	if customCfg != nil {
		mergeCustomSettings(&profile.Settings.Remaster, &customCfg.Remaster)
	}

	return &profile, nil
}

func defaultRemasterConfig() RemasterConfig {
	return RemasterConfig{
		User:     "live",
		Password: "evolution",
		WorkDir:  "/home/eggs",
		Compression: CompressionConfig{
			Algorithm: "zstd",
			Level:     3,
		},
	}
}

func mergeCustomSettings(base *RemasterConfig, custom *RemasterConfig) {
	if custom.User != "" {
		base.User = custom.User
	}
	if custom.Password != "" {
		base.Password = custom.Password
	}
	if custom.WorkDir != "" {
		base.WorkDir = custom.WorkDir
	}
	if custom.Compression.Algorithm != "" {
		base.Compression.Algorithm = custom.Compression.Algorithm
	}
	if custom.Compression.Level > 0 {
		base.Compression.Level = custom.Compression.Level
	}
	if custom.ISOPrefix != "" {
		base.ISOPrefix = custom.ISOPrefix
	}
}

func LoadCustomSettings() (*Settings, error) {
	v := viper.New()
	v.SetConfigName("custom") // Cerca custom.yaml o custom.yml
	v.AddConfigPath("/etc/oa-tools.d/")
	v.AddConfigPath(".") // Utile per test veloci nella dir corrente

	// Se il file non esiste, usciamo silenziosamente
	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			return nil, nil // Nessun custom trovato, tutto ok
		}
		return nil, err // Errore reale di lettura
	}

	var settings Settings
	if err := v.Unmarshal(&settings); err != nil {
		return nil, err
	}
	return &settings, nil
}
