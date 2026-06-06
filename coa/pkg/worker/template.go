package worker

import (
	"bytes"
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

func RunTemplate(config ActionTemplate) error {
	// 1. Routing Intelligente del Percorso
	var fullPath string
	if config.Chroot {
		// Scrittura DENTRO il chroot (es. /home/eggs/liveroot/usr/share/...)
		fullPath = filepath.Join(config.ResolvedTargetRoot, config.Params.Dest)
	} else {
		// Scrittura SULL'HOST (es. /home/eggs/isodir/EFI/BOOT/grub.cfg)
		fullPath = config.Params.Dest
	}

	// 2. Prepariamo i "Facts" per il template
	ctx := TemplateContext{
		TargetRoot: config.ResolvedTargetRoot,
		Vars:       config.Params.Vars,
	}

	// 3. Creiamo i nostri "Filtri" (come in Ansible/Jinja2)
	funcMap := template.FuncMap{
		"osRelease": func(key string) string {
			releasePath := filepath.Join(config.ResolvedTargetRoot, "etc/os-release")
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

	// 4. Compiliamo il template attivando i filtri E I DELIMITATORI [[ ]]
	tmpl, err := template.New("oa_template").Delims("[[", "]]").Funcs(funcMap).Parse(config.Params.Content)
	if err != nil {
		return fmt.Errorf("errore di sintassi nel template YAML: %v", err)
	}

	// 5. Eseguiamo il rendering in memoria
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, ctx); err != nil {
		return fmt.Errorf("errore durante il rendering del template: %v", err)
	}

	// 6. Creazione directory e scrittura su disco (usando il fullPath calcolato)
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("impossibile creare le directory per %s: %v", fullPath, err)
	}

	perms := os.FileMode(config.Params.Permissions)
	if config.Params.Permissions == 0 {
		perms = 0644
	}

	// Scriviamo il buffer sul disco
	if err := os.WriteFile(fullPath, buf.Bytes(), perms); err != nil {
		return fmt.Errorf("errore durante la scrittura del file: %v", err)
	}

	// Output pulito per la console
	fmt.Printf("🥚 [oa-ell] Template renderizzato e scritto su: %s\n", fullPath)
	return nil
}
