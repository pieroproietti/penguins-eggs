package setup

import (
	"os"
	"path/filepath"
	"strings"
	"time"

	"coa/pkg/utils"
)

// MountConfig contiene i dati da iniettare nel template
type MountConfig struct {
	Date   string
	IsBIOS bool // Flag per disinnescare la compressione zstd per compatibilità GRUB
}

// parseCalamaresBranch valuta se la versione è 3.2.x o 3.3.x da una stringa di versione/output.
func parseCalamaresBranch(output string) string {
	cleaned := strings.TrimSpace(output)
	if strings.Contains(cleaned, "3.2.") || strings.Contains(cleaned, "3.2-") || strings.HasPrefix(cleaned, "3.2") {
		return "3.2"
	}
	return "3.3"
}

// getCalamaresRawVersion rileva la versione interrogando il gestore pacchetti
// oppure eseguendo calamares in modalità headless (QT_QPA_PLATFORM=offscreen).
func getCalamaresRawVersion() string {
	// 1. DPKG (Debian, Devuan, Ubuntu): istantaneo e non richiede server X/DISPLAY
	if out, err := utils.ExecCapture("dpkg-query -W -f='${Version}' calamares 2>/dev/null"); err == nil && strings.TrimSpace(out) != "" {
		return strings.TrimSpace(out)
	}

	// 2. PACMAN (Arch, Manjaro)
	if out, err := utils.ExecCapture("pacman -Q calamares 2>/dev/null"); err == nil && strings.TrimSpace(out) != "" {
		return strings.TrimSpace(out)
	}

	// 3. RPM (Fedora, openSUSE)
	if out, err := utils.ExecCapture("rpm -q --qf '%{VERSION}' calamares 2>/dev/null"); err == nil && strings.TrimSpace(out) != "" {
		return strings.TrimSpace(out)
	}

	// 4. Calamares headless (offscreen evita l'abort di Qt per assenza di DISPLAY in sudo/TTY)
	if out, _ := utils.ExecCaptureCombined("QT_QPA_PLATFORM=offscreen calamares --version 2>&1"); strings.TrimSpace(out) != "" {
		return strings.TrimSpace(out)
	}

	// 5. Fallback standard
	if out, _ := utils.ExecCaptureCombined("calamares --version 2>&1"); strings.TrimSpace(out) != "" {
		return strings.TrimSpace(out)
	}

	return ""
}

// getCalamaresBranch esegue la rilevazione e restituisce "3.2" se rileva 3.2.x, altrimenti "3.3".
func getCalamaresBranch() string {
	raw := getCalamaresRawVersion()
	branch := parseCalamaresBranch(raw)
	utils.LogNormal("Calamares version check: raw=%q -> branch=%s", raw, branch)
	return branch
}

func mountConf() error {
	tableType := getPartitionTableType()

	config := MountConfig{
		Date:   time.Now().Format("2006-01-02"),
		IsBIOS: tableType == "msdos",
	}

	targetPath := filepath.Join(InstallerDRoot, "modules", "mount.conf")

	// Assicuriamoci che la directory esista
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return err
	}

	branch := getCalamaresBranch()
	tmplName := "mount.conf.3.3.tmpl"
	if branch == "3.2" {
		tmplName = "mount.conf.3.2.tmpl"
		utils.LogNormal("Calamares 3.2.x detected: using legacy mount.conf")
	} else {
		utils.LogNormal("Calamares 3.3.x detected: using modern mount.conf")
	}

	return renderAndSaveEmbedded(tmplName, targetPath, config, 0644)
}
