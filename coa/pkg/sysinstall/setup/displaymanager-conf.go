package setup

import (
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

// DisplayManagerConfig contiene i dati da iniettare nel template
type DisplayManagerConfig struct {
	Date   string
	DMName string
}

// GetActiveDM rileva quale Display Manager è installato nel "pieno"
func GetActiveDM() (string, string) {
	// Mappa dei DM e dei relativi file di configurazione
	dms := map[string]string{
		"lightdm": "/etc/lightdm/lightdm.conf",
		"sddm":    "/etc/sddm.conf",
		"gdm3":    "/etc/gdm3/daemon.conf",
		"gdm":     "/etc/gdm/custom.conf",
		"lxdm":    "/etc/lxdm/lxdm.conf",
	}

	for name, conf := range dms {
		if _, err := exec.LookPath(name); err == nil {
			return name, conf
		}
	}
	return "none", ""
}

// PrepareDisplaymanagerConf genera la configurazione per il login
func displaymanagerConf() error {
	dmName, _ := GetActiveDM()

	// Se non troviamo DM, meglio non scrivere il file
	if dmName == "none" {
		return nil
	}

	config := DisplayManagerConfig{
		Date:   time.Now().Format("2006-01-02"),
		DMName: dmName,
	}

	targetPath := filepath.Join(InstallerDRoot, "modules", "displaymanager.conf")

	// Ci assicuriamo che la cartella modules esista
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return err
	}

	return renderAndSaveEmbedded("displaymanager.conf.tmpl", targetPath, config, 0644)
}
