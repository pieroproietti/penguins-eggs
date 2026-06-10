// worker/template.go
package worker

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"text/template"
)

// TemplateContext sono i "Facts" che passiamo al template
type TemplateContext struct {
	TargetRoot string
	Vars       map[string]string
}

// RunTemplate renderizza una stringa template e la salva su disco, gestendo i percorsi chroot.
// Riceve il payload JSON grezzo dal dispatcher.
func RunTemplate(payload []byte) error {
	// 1. Struttura locale che definisce i parametri richiesti da questo modulo
	var config struct {
		Chroot             bool   `json:"chroot"`
		LiveRoot string `json:"live_root,omitempty"`
		Params             struct {
			Dest        string            `json:"dest"`
			Content     string            `json:"content"`
			Vars        map[string]string `json:"vars"`
			Permissions os.FileMode       `json:"permissions"`
		} `json:"params"`
	}

	// 2. Decodifica del pacchetto inviato dal dispatcher
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON per modulo template: %w", err)
	}

	// Controlli di sicurezza per evitare panici successivi
	if config.Params.Dest == "" {
		return fmt.Errorf("modulo template: parametro 'dest' mancante")
	}
	if config.Params.Content == "" {
		return fmt.Errorf("modulo template: parametro 'content' mancante")
	}

	// 3. Routing Intelligente del Percorso
	var fullPath string
	if config.Chroot {
		if config.LiveRoot == "" {
			return fmt.Errorf("chroot richiesto ma live_root mancante")
		}
		// Scrittura DENTRO il chroot (es. /home/eggs/liveroot/usr/share/...)
		fullPath = filepath.Join(config.LiveRoot, config.Params.Dest)
	} else {
		// Scrittura SULL'HOST (es. /home/eggs/isodir/EFI/BOOT/grub.cfg)
		fullPath = config.Params.Dest
	}

	// 4. Prepariamo i "Facts" per il template
	ctx := TemplateContext{
		TargetRoot: config.LiveRoot,
		Vars:       config.Params.Vars,
	}

	// 5. Creiamo i nostri "Filtri" (come in Ansible/Jinja2)
	funcMap := template.FuncMap{
		"osRelease": func(key string) string {
			releasePath := filepath.Join(config.LiveRoot, "etc/os-release")
			data, err := os.ReadFile(releasePath)
			if err != nil {
				return "OA Live" // Fallback elegante
			}
			for _, line := range strings.Split(string(data), "\n") {
				if strings.HasPrefix(line, key+"=") {
					val := strings.TrimPrefix(line, key+"=")
					return strings.Trim(val, `"'`) // Rimuove gli apici
				}
			}
			return "OA Live"
		},
		"upper": strings.ToUpper,
	}

	// 6. Compiliamo il template attivando i filtri E I DELIMITATORI [[ ]]
	tmpl, err := template.New("oa_template").Delims("[[", "]]").Funcs(funcMap).Parse(config.Params.Content)
	if err != nil {
		return fmt.Errorf("errore di sintassi nel template: %w", err)
	}

	// 7. Eseguiamo il rendering in memoria
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, ctx); err != nil {
		return fmt.Errorf("errore durante il rendering del template: %w", err)
	}

	// 8. Creazione directory e scrittura su disco (usando il fullPath calcolato)
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("impossibile creare le directory per %s: %w", fullPath, err)
	}

	perms := config.Params.Permissions
	if perms == 0 {
		perms = 0644
	}

	// Scriviamo il buffer sul disco
	if err := os.WriteFile(fullPath, buf.Bytes(), perms); err != nil {
		return fmt.Errorf("errore durante la scrittura del file: %w", err)
	}

	// Output pulito per la console
	fmt.Printf("📦 [worker] Template renderizzato e scritto su: %s\n", fullPath)
	return nil
}
