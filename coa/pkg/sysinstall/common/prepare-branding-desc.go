package sysinstall

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// PrepareBrandingDesc genera dinamicamente il file branding.desc leggendo os-release.
// Riceve in input la versione di oa-tools (es. "0.7.6") da iniettare nel branding.
func PrepareBrandingDesc(oaVersion string) error {
	oaVersion = "oa-tools " + oaVersion

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
		supportUrl = "https://github.com/pieroproietti/oa-tools/issues/"
	}

	bugReportUrl := osInfo["BUG_REPORT_URL"]
	if bugReportUrl == "" {
		bugReportUrl = "https://github.com/pieroproietti/oa-tools/issues/"
	}

	// Usiamo HOME_URL come fallback per le note di rilascio se non c'è di meglio
	releaseNotesUrl := homeUrl

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
  productUrl:          "%s"
  supportUrl:          "%s"
  knownIssuesUrl:      "%s"
  releaseNotesUrl:     "%s"

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
		oaVersion,                              // version
		oaVersion,                              // shortVersion
		strings.ToLower(prettyName), oaVersion, // versionedName
		strings.ToUpper(prettyName), oaVersion, // shortVersionedName
		name,            // bootloaderEntryName
		homeUrl,         // productUrl
		supportUrl,      // supportUrl
		bugReportUrl,    // knownIssuesUrl
		releaseNotesUrl, // releaseNotesUrl
	)

	// 4. Scrittura del file
	targetDir := InstallerDRoot + "/branding/eggs"
	targetPath := filepath.Join(targetDir, "branding.desc")

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return fmt.Errorf("impossibile creare la directory di branding: %v", err)
	}

	return os.WriteFile(targetPath, []byte(config), 0644)
}
