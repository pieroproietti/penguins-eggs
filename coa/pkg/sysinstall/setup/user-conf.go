package setup

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// UserConfig contiene i dati da iniettare nel template YAML
type UserConfig struct {
	Date       string
	Groups     []string
	AdminGroup string
}

func userConf() error {
	// 1. Identifichiamo l'utente live
	liveUser := os.Getenv("SUDO_USER")
	if liveUser == "" || liveUser == "root" {
		liveUser = "live"
	}

	// 2. Leggiamo i gruppi reali
	cmd := exec.Command("id", "-Gn", liveUser)
	out, err := cmd.Output()

	var validGroups []string
	adminGroup := "wheel" // Default universale

	if err == nil {
		rawGroups := strings.Fields(string(out))
		for _, g := range rawGroups {
			if g != liveUser {
				validGroups = append(validGroups, g)
			}
			if g == "sudo" {
				adminGroup = "sudo"
			}
		}
	} else {
		// Fallback di emergenza
		wishlist := []string{"users", "wheel", "sudo", "audio", "video", "storage", "network", "lp", "scanner"}
		data, _ := os.ReadFile("/etc/group")
		content := string(data)
		for _, g := range wishlist {
			if strings.Contains(content, "\n"+g+":") || strings.HasPrefix(content, g+":") {
				validGroups = append(validGroups, g)
				if g == "sudo" {
					adminGroup = "sudo"
				}
			}
		}
	}

	// 3. Prepariamo la struttura dati
	config := UserConfig{
		Date:       time.Now().Format("2006-01-02"),
		Groups:     validGroups, // Passiamo l'array nudo e crudo!
		AdminGroup: adminGroup,
	}

	// 4. Scriviamo usando il template
	targetPath := filepath.Join(InstallerDRoot, "modules", "users.conf")
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return err
	}

	return renderAndSaveEmbedded("users.conf.tmpl", targetPath, config, 0644)
}
