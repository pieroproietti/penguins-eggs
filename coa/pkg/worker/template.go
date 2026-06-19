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

type TemplateContext struct {
	TargetRoot string
	Vars       map[string]string
}

func RunTemplate(payload []byte) error {
	var config struct {
		Chroot   bool   `json:"chroot"`
		LiveRoot string `json:"live_root,omitempty"`
		Params   struct {
			Dest        string            `json:"dest"`
			Content     string            `json:"content"`
			Vars        map[string]string `json:"vars"`
			Permissions os.FileMode       `json:"permissions"`
		} `json:"params"`
	}

	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("error parsing JSON for template module: %w", err)
	}

	if config.Params.Dest == "" {
		return fmt.Errorf("template module: missing 'dest' parameter")
	}
	if config.Params.Content == "" {
		return fmt.Errorf("template module: missing 'content' parameter")
	}

	var fullPath string
	if config.Chroot {
		if config.LiveRoot == "" {
			return fmt.Errorf("chroot requested but live_root is missing")
		}
		fullPath = filepath.Join(config.LiveRoot, config.Params.Dest)
	} else {
		fullPath = config.Params.Dest
	}

	ctx := TemplateContext{
		TargetRoot: config.LiveRoot,
		Vars:       config.Params.Vars,
	}

	funcMap := template.FuncMap{
		"osRelease": func(key string) string {
			releasePath := filepath.Join(config.LiveRoot, "etc/os-release")
			data, err := os.ReadFile(releasePath)
			if err != nil {
				return "OA Live"
			}
			for _, line := range strings.Split(string(data), "\n") {
				if strings.HasPrefix(line, key+"=") {
					val := strings.TrimPrefix(line, key+"=")
					return strings.Trim(val, `"'`)
				}
			}
			return "OA Live"
		},
		"upper": strings.ToUpper,
	}

	tmpl, err := template.New("oa_template").Delims("[[", "]]").Funcs(funcMap).Parse(config.Params.Content)
	if err != nil {
		return fmt.Errorf("template syntax error: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, ctx); err != nil {
		return fmt.Errorf("error rendering template: %w", err)
	}

	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("unable to create directories for %s: %w", fullPath, err)
	}

	perms := config.Params.Permissions
	if perms == 0 {
		perms = 0644
	}

	if err := os.WriteFile(fullPath, buf.Bytes(), perms); err != nil {
		return fmt.Errorf("error writing file: %w", err)
	}

	fmt.Printf("📦 [worker] Template rendered and written to: %s\n", fullPath)
	return nil
}
