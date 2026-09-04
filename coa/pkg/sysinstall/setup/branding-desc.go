package setup

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

var defaultCalamaresBranding = "/etc/penguins-eggs.d/branding.default/calamares/branding"

// BrandingConfig contiene i dati dinamici da iniettare nel template
type BrandingConfig struct {
	ProductName         string
	ShortProductName    string
	Version             string
	VersionedName       string
	ShortVersionedName  string
	BootloaderEntryName string
	ProductUrl          string
	SupportUrl          string
	KnownIssuesUrl      string
	ReleaseNotesUrl     string
}

// PrepareBrandingDesc genera dinamicamente il file branding.desc leggendo os-release.
func brandingDesc(oaVersion string) error {
	fullVersion := "penguins-eggs " + oaVersion

	// 1. Carichiamo le info dal sistema (os-release)
	osInfo := make(map[string]string)
	file, err := os.Open("/etc/os-release")
	if err == nil {
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := scanner.Text()
			if parts := strings.SplitN(line, "=", 2); len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.Trim(parts[1], "\"")
				osInfo[key] = value
			}
		}
		file.Close()
	}

	// 2. Prepariamo i valori dinamici base
	name := osInfo["NAME"]
	if name == "" {
		name = "Linux"
	}
	prettyName := osInfo["PRETTY_NAME"]
	if prettyName == "" {
		prettyName = name
	}

	// 3. Estrazione degli URL originali della distro con fallback
	homeUrl := osInfo["HOME_URL"]
	if homeUrl == "" {
		homeUrl = "https://penguins-eggs.net/"
	}

	supportUrl := osInfo["SUPPORT_URL"]
	if supportUrl == "" {
		supportUrl = "https://github.com/pieroproietti/penguins-eggs/issues/"
	}

	bugReportUrl := osInfo["BUG_REPORT_URL"]
	if bugReportUrl == "" {
		bugReportUrl = "https://github.com/pieroproietti/penguins-eggs/issues/"
	}

	releaseNotesUrl := homeUrl

	// 4. Popoliamo la struttura per il template
	config := BrandingConfig{
		ProductName:         strings.ToUpper(prettyName),
		ShortProductName:    strings.ToLower(prettyName),
		Version:             fullVersion,
		VersionedName:       fmt.Sprintf("%s (%s)", strings.ToLower(prettyName), fullVersion),
		ShortVersionedName:  fmt.Sprintf("%s %s", strings.ToUpper(prettyName), fullVersion),
		BootloaderEntryName: name,
		ProductUrl:          homeUrl,
		SupportUrl:          supportUrl,
		KnownIssuesUrl:      bugReportUrl,
		ReleaseNotesUrl:     releaseNotesUrl,
	}

	// 5. Materializziamo gli asset predefiniti nel workspace temporaneo.
	targetDir := filepath.Join(InstallerDRoot, "branding", "eggs")
	targetPath := filepath.Join(targetDir, "branding.desc")

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return fmt.Errorf("unable to create branding directory: %v", err)
	}

	defaultTemplate := filepath.Join(defaultCalamaresBranding, "branding.desc.tmpl")
	if fi, err := os.Stat(defaultCalamaresBranding); err == nil && fi.IsDir() {
		if err := copyBrandingOverlay(defaultCalamaresBranding, targetDir); err != nil {
			return fmt.Errorf("unable to apply default Calamares branding from %s: %v", defaultCalamaresBranding, err)
		}
		if err := renderAndSaveFile(defaultTemplate, targetPath, config, 0644); err != nil {
			return err
		}
		if err := os.Remove(filepath.Join(targetDir, "branding.desc.tmpl")); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("unable to remove rendered branding template: %v", err)
		}
	} else if err := renderAndSaveEmbedded("branding.desc.tmpl", targetPath, config, 0644); err != nil {
		return err
	}

	// 6. Sovrascriviamo/completiamo il branding predefinito con gli asset del
	// vendor, se presenti. Un costume dell'atelier (es. "quirinux" da penguins-wardrobe)
	// puo' depositare qui logo, slideshow e un branding.desc proprio tramite il
	// suo overlay sysroot (stessa cartella usata per lo splash di
	// GRUB/ISOLINUX in base.yaml.tmpl), senza bisogno di alcun comando
	// aggiuntivo oltre all'applicazione del costume con penguins-tailor ('tailor wear').
	vendorBranding := "/etc/penguins-eggs.d/branding/calamares/branding"
	if fi, err := os.Stat(vendorBranding); err == nil && fi.IsDir() {
		if err := copyBrandingOverlay(vendorBranding, targetDir); err != nil {
			return fmt.Errorf("unable to apply vendor calamares branding from %s: %v", vendorBranding, err)
		}
	}

	return nil
}

// copyBrandingOverlay copia ricorsivamente il contenuto di src dentro dst,
// sovrascrivendo i file generati automaticamente (branding.desc incluso, se
// il vendor ne fornisce uno proprio) e aggiungendo quelli nuovi (logo.png,
// show.qml, immagini dello slideshow...).
func copyBrandingOverlay(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if info.IsDir() {
			return os.MkdirAll(target, 0755)
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, info.Mode())
	})
}
