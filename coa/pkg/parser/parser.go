package parser

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"text/template"

	"coa/pkg/distro"
	"coa/pkg/utils"

	"github.com/spf13/viper"
	"gopkg.in/yaml.v3"
)

func DetectAndLoad(isGitHubAction bool) (*Profile, error) {
	myDistro := distro.NewDistro()

	var baseDir string
	pathsToTry := []string{
		filepath.Join("coa", "brain.d"),
		"/etc/oa-tools.d/brain.d",
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

	indexData, err := os.ReadFile(indexPath)
	if err != nil {
		return nil, fmt.Errorf("unable to read index %s: %v", indexPath, err)
	}

	var index BrainIndex
	if err := yaml.Unmarshal(indexData, &index); err != nil {
		return nil, fmt.Errorf("syntax error in index.yaml: %v", err)
	}

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

	basePath := filepath.Join(baseDir, "base.yaml.tmpl")
	modulePath := filepath.Join(baseDir, "modules", moduleFile)

	utils.LogNormal("%s[parser]%s Compilazione: base.yaml.tmpl + %s", utils.ColorCyan, utils.ColorReset, moduleFile)

	ctx := TemplateContext{
		Family:         myDistro.FamilyID,
		DistroID:       myDistro.DistroID,
		IsGitHubAction: isGitHubAction,
	}

	tmpl := template.New(filepath.Base(basePath))

	tmpl.Funcs(template.FuncMap{
		"indent": func(spaces int, v string) string {
			pad := strings.Repeat(" ", spaces)
			return pad + strings.ReplaceAll(v, "\n", "\n"+pad)
		},
		"include": func(name string, data interface{}) (string, error) {
			buf := new(bytes.Buffer)
			err := tmpl.ExecuteTemplate(buf, name, data)
			return buf.String(), err
		},
	})

	_, err = tmpl.ParseFiles(basePath, modulePath)
	if err != nil {
		return nil, fmt.Errorf("error parsing templates: %v", err)
	}

	var rendered bytes.Buffer
	if err := tmpl.ExecuteTemplate(&rendered, "base.yaml.tmpl", ctx); err != nil {
		return nil, fmt.Errorf("error rendering profile: %v", err)
	}

	var profile Profile
	if err := yaml.Unmarshal(rendered.Bytes(), &profile); err != nil {
		os.WriteFile("/tmp/oa-failed-yaml.txt", rendered.Bytes(), 0644)
		return nil, fmt.Errorf("YAML syntax error (see /tmp/oa-failed-yaml.txt): %v", err)
	}

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
	v.SetConfigName("custom")
	v.AddConfigPath("/etc/oa-tools.d/")
	v.AddConfigPath(".")

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			return nil, nil
		}
		return nil, err
	}

	var settings Settings
	if err := v.Unmarshal(&settings); err != nil {
		return nil, err
	}
	return &settings, nil
}
