package calamares

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// PrepareBranding genera dinamicamente il file branding.desc leggendo os-release.
// Riceve in input la versione di oa-tools (es. "0.7.6") da iniettare nel branding.
func PrepareBrandingDesc(oaVersion string) error {
	// 1. Carichiamo le info dal sistema (os-release)
	osInfo := make(map[string]string)
	file, err := os.Open("/etc/os-release")
	if err == nil {
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := scanner.Text()
			if parts := strings.SplitN(line, "=", 2); len(parts) == 2 {
				key := parts[0]
				value := strings.Trim(parts[1], "\"")
				osInfo[key] = value
			}
		}
		file.Close()
	}

	// 2. Prepariamo i valori dinamici
	name := osInfo["NAME"]
	if name == "" {
		name = "Linux"
	}
	prettyName := osInfo["PRETTY_NAME"]
	if prettyName == "" {
		prettyName = name
	}

	config := fmt.Sprintf(`---
componentName: eggs

images:
  productIcon:    "eggs.png"
  productLogo:    "eggs.png"
  productWelcome: "welcome.png"

slideshow:       "show.qml"
slideshowAPI:    1

strings:
  productName:         "%s"
  shortProductName:    "%s"
  version:             "%s"
  shortVersion:        "%s"
  versionedName:       "%s (%s)"
  shortVersionedName:  "%s %s"
  bootloaderEntryName: "%s"
  productUrl:          "https://penguins-eggs.net/"
  supportUrl:          "https://github.com/pieroproietti/oa-tools/issues/"
  knownIssuesUrl:      "https://github.com/pieroproietti/oa-tools/issues/"
  releaseNotesUrl:     "https://penguins-eggs.net/blog/"

style:
  SidebarBackground:        "#292F34"
  sidebarBackground:        "#292F34"
  SidebarBackgroundCurrent: "#D35400"
  sidebarBackgroundCurrent: "#D35400"
  SidebarText:              "#FFFFFF"
  sidebarText:              "#FFFFFF"
  SidebarTextCurrent:       "#292F34"
  sidebarTextCurrent:       "#292F34"

welcomeStyleCalamares: true
`,
		strings.ToUpper(prettyName),            // productName
		strings.ToLower(prettyName),            // shortProductName
		oaVersion,                              // shortVersion (es. 0.7.6)
		"oa-tools "+oaVersion,                  // version (es. oa-tools v0.7.6)
		strings.ToLower(prettyName), oaVersion, // versionedName
		strings.ToUpper(prettyName), oaVersion, // shortVersionedName
		name, // bootloaderEntryName
	)

	// 4. Scrittura del file
	targetDir := "/etc/calamares/branding/eggs"
	targetPath := filepath.Join(targetDir, "branding.desc")

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return fmt.Errorf("impossibile creare la directory di branding: %v", err)
	}

	return os.WriteFile(targetPath, []byte(config), 0644)
}
