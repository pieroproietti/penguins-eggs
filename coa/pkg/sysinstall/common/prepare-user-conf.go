package sysinstall

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func PrepareUserConf() error {
	// 1. Identifichiamo l'utente live che ha lanciato il comando
	liveUser := os.Getenv("SUDO_USER")
	if liveUser == "" || liveUser == "root" {
		// Fallback di sicurezza se SUDO_USER non è disponibile
		liveUser = "live"
	}

	// 2. Leggiamo i gruppi reali a cui appartiene l'utente live usando 'id'
	cmd := exec.Command("id", "-Gn", liveUser)
	out, err := cmd.Output()

	var validGroups []string
	adminGroup := "wheel" // Default universale

	if err == nil {
		// Se il comando 'id' ha successo, esplodiamo la stringa in un array
		rawGroups := strings.Fields(string(out))
		for _, g := range rawGroups {
			// Evitiamo di inserire il gruppo primario (che di solito si chiama come l'utente)
			if g != liveUser {
				validGroups = append(validGroups, g)
			}
			// Intercettiamo dinamicamente il gruppo di amministrazione corretto!
			if g == "sudo" {
				adminGroup = "sudo"
			}
		}
	} else {
		// Fallback di emergenza: scansioniamo /etc/group con una wishlist estesa
		wishlist := []string{"users", "wheel", "sudo", "audio", "video", "storage", "network", "lp", "scanner"}
		data, _ := os.ReadFile("/etc/group")
		content := string(data)
		for _, g := range wishlist {
			// Usiamo HasPrefix e Contains con \n per matchare esattamente il nome del gruppo
			if strings.Contains(content, "\n"+g+":") || strings.HasPrefix(content, g+":") {
				validGroups = append(validGroups, g)
				if g == "sudo" {
					adminGroup = "sudo"
				}
			}
		}
	}

	// 3. Costruiamo la lista YAML per Calamares
	var yamlGroups string
	for _, g := range validGroups {
		yamlGroups += fmt.Sprintf("  - %s\n", g)
	}

	// 4. Generiamo lo YAML basato sul tuo template
	// NOTA: %s su sudoersGroup inietta "sudo" o "wheel" dinamicamente!
	config := fmt.Sprintf(`---
# OA-Tools: Configurazione Universale Dinamica
# Password: Approccio "Libertario" totale per Eggs & Bananas

defaultGroups:
%s

sudoersGroup:    %s
sudoersConfigureWithGroup: false

# Disabilitiamo la rimozione dell'utente live qui se usiamo il modulo specifico
# removeLiveUser: true 

# --- IL FIX PER LE PASSWORD ---
# Permettiamo esplicitamente password deboli e lo impostiamo come default
allowWeakPasswords: true
allowWeakPasswordsDefault: true

passwordRequirements:
  minLength: -1
  maxLength: -1
  libpwquality:
    - minlen=0
    - minclass=0
    - dictcheck=0  # <--- DISATTIVA IL CONTROLLO DIZIONARIO
    - usercheck=0  # Disattiva controllo basato sul nome utente

# Configurazione User & Hostname
user:
  shell: /bin/bash
  forbidden_names: [ root, nobody ]
  home_permissions: "o700"

hostname:
  location: EtcFile
  writeHostsFile: true
  template: "oa-${product}"
`, yamlGroups, adminGroup)

	targetPath := InstallerDRoot + "/modules/users.conf"
	os.MkdirAll(filepath.Dir(targetPath), 0755)

	return os.WriteFile(targetPath, []byte(config), 0644)
}
