package pilot

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"text/template"

	"coa/pkg/distro"
	"coa/pkg/utils"

	"gopkg.in/yaml.v3"
)

// TemplateContext definisce i dati che iniettiamo nei file .tmpl
type TemplateContext struct {
	Family   string
	DistroID string
}

// Strutture per il mapping dell'indice
type BrainIndex struct {
	Distributions []DistroMap `yaml:"distributions"`
}

type DistroMap struct {
	ID   string   `yaml:"id"`
	Like []string `yaml:"like"`
	File string   `yaml:"file"`
}

// DetectAndLoad rileva il sistema e consulta l'index.yaml per trovare lo spartito corretto.
// Implementa il fallback tra ambiente di sviluppo locale e directory di sistema /etc.
func DetectAndLoad() (*Profile, error) {
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

	// 5. RENDERING DEI TEMPLATE (Composizione Base + Modulo)
	basePath := filepath.Join(baseDir, "base.yaml.tmpl")
	// Assumiamo che i moduli siano nella sottocartella 'modules' e abbiano estensione .tmpl
	// Se l'indice riporta ancora "debian.yaml", lo convertiamo in "debian.tmpl" o puntiamo direttamente
	modulePath := filepath.Join(baseDir, "modules", moduleFile)

	utils.LogCoala("%s[pilot]%s Compilazione: base.yaml.tmpl + %s", utils.ColorCyan, utils.ColorReset, moduleFile)

	// Context da passare al template
	ctx := TemplateContext{
		Family:   myDistro.FamilyID,
		DistroID: myDistro.DistroID,
	}

	// Carichiamo entrambi i file.
	// template.ParseFiles associa i nomi dei file ai template interni.
	tmpl, err := template.ParseFiles(basePath, modulePath)
	if err != nil {
		return nil, fmt.Errorf("errore nel parsing dei template (%s, %s): %v", basePath, modulePath, err)
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

	return &profile, nil
}
