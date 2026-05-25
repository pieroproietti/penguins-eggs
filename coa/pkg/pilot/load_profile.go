package pilot

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
		return nil, fmt.Errorf("nessuna configurazione brain trovata nei percorsi previsti")
	}

	indexPath := filepath.Join(baseDir, "index.yaml")

	// 3. Lettura e parsing dell'indice
	indexData, err := os.ReadFile(indexPath)
	if err != nil {
		return nil, fmt.Errorf("impossibile leggere l'indice %s: %v", indexPath, err)
	}

	var index BrainIndex
	if err := yaml.Unmarshal(indexData, &index); err != nil {
		return nil, fmt.Errorf("errore sintassi index.yaml: %v", err)
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
		return nil, fmt.Errorf("nessun modulo trovato per %s (ID: %s)", myDistro.DistroLike, myDistro.DistroID)
	}

	// 5. RENDERING DEI TEMPLATE (Composizione Common + Modulo + Base)
	basePath := filepath.Join(baseDir, "base.yaml.tmpl")
	commonPath := filepath.Join(baseDir, "common.bash.tmpl")

	// Assumiamo che i moduli siano nella sottocartella 'modules' e abbiano estensione .tmpl
	modulePath := filepath.Join(baseDir, "modules", moduleFile)

	// Log aggiornato per mostrare la tripla fusione
	utils.LogNormal("%s[pilot]%s Compilazione: common.bash.tmpl + %s + base.yaml.tmpl", utils.ColorCyan, utils.ColorReset, moduleFile)

	// Context da passare al template
	ctx := TemplateContext{
		Family:         myDistro.FamilyID,
		DistroID:       myDistro.DistroID,
		IsGitHubAction: isGitHubAction,
	}

	// Creiamo un nuovo template base
	tmpl := template.New(filepath.Base(basePath)) // <-- Corretto: usiamo basePath

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

	// 3. Parsiamo i file
	// Usiamo _, err per non ridefinire tmpl, dato che ParseFiles agisce sul puntatore
	_, err = tmpl.ParseFiles(commonPath, modulePath, basePath)
	if err != nil {
		return nil, fmt.Errorf("errore nel parsing dei template (%s, %s, %s): %v", commonPath, modulePath, basePath, err)
	}

	var rendered bytes.Buffer
	// Eseguiamo il template puntando esplicitamente al file base che farà da telaio
	if err := tmpl.ExecuteTemplate(&rendered, "base.yaml.tmpl", ctx); err != nil {
		return nil, fmt.Errorf("errore durante il rendering del profilo: %v", err)
	}

	// 6. Parsing dello YAML finale renderizzato
	var profile Profile
	if err := yaml.Unmarshal(rendered.Bytes(), &profile); err != nil {
		return nil, fmt.Errorf("errore sintassi nello YAML generato: %v", err)
	}

	// 7. OVERRIDE: Applichiamo il custom.yml se esiste
	customCfg, err := LoadCustomSettings() // <--- Qui ricevi ENTRAMBI
	if err != nil {
		return nil, fmt.Errorf("errore nel caricamento di custom.yml: %v", err)
	}

	if customCfg != nil {
		profile.Settings.Remaster = customCfg.Remaster
	}

	return &profile, nil
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
	fmt.Printf("[DEBUG] Settings caricati da custom.yml: %+v\n", settings)
	return &settings, nil
}
