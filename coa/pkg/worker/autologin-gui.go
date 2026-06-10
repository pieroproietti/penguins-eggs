// worker/autologin.go
package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// RunAutologin coordina le configurazioni per i vari Display Manager.
// Ora riceve i byte grezzi dal dispatcher e li decodifica in autonomia.
func RunAutologin(payload []byte) error {
	// 1. Struttura locale, niente più dipendenze globali dal planner
	var config struct {
		LiveRoot string `json:"live_root,omitempty"`
		Params             struct {
			User string `json:"user"`
		} `json:"params"`
	}

	// 2. Unmarshal del pacco ricevuto
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON per modulo autologin-gui: %w", err)
	}

	root := config.LiveRoot
	user := config.Params.User

	if user == "" {
		user = "pippo" // Fallback di sicurezza
	}

	fmt.Printf("📦 [worker] Esecuzione autologin-gui per utente '%s'\n", user)

	// 1. Rimuove la password e sblocca l'utente nel chroot
	fmt.Println(" -> Sblocco utente (passwd/usermod)...")
	exec.Command("chroot", root, "passwd", "-d", user).Run()
	exec.Command("chroot", root, "usermod", "-U", user).Run()

	// 2. Trova la sessione preferita
	session := findPreferredSession(root)
	fmt.Printf(" -> Sessione Desktop rilevata: %s\n", session)

	// 3. Applica le configurazioni ai vari DM
	configureSDDM(root, user, session)
	configureLightDM(root, user, session)
	configureGDM(root, user)
	// Puoi aggiungere agilmente Slim, LXDM e Greetd seguendo lo stesso pattern

	return nil
}

// Trova la sessione cercando i file .desktop installati
func findPreferredSession(root string) string {
	xsessionsDir := filepath.Join(root, "usr/share/xsessions")
	files, err := filepath.Glob(filepath.Join(xsessionsDir, "*.desktop"))
	if err != nil || len(files) == 0 {
		return "xfce"
	}

	preferences := []string{"plasma", "lxqt", "lubuntu", "xfce"}

	for _, file := range files {
		name := strings.TrimSuffix(filepath.Base(file), ".desktop")
		nameLower := strings.ToLower(name)
		for _, pref := range preferences {
			if strings.Contains(nameLower, pref) {
				return name
			}
		}
	}

	return strings.TrimSuffix(filepath.Base(files[0]), ".desktop")
}

// Configura SDDM
func configureSDDM(root, user, session string) {
	sddmShare := filepath.Join(root, "usr/share/sddm")
	sddmEtc := filepath.Join(root, "etc/sddm.conf.d")

	if _, err := os.Stat(sddmShare); err == nil || os.MkdirAll(sddmEtc, 0755) == nil {
		fmt.Println(" -> Configurazione SDDM in corso...")
		os.MkdirAll(sddmEtc, 0755)
		confPath := filepath.Join(sddmEtc, "autologin.conf")
		content := fmt.Sprintf("[Autologin]\nUser=%s\nSession=%s\nRelogin=false\n", user, session)
		os.WriteFile(confPath, []byte(content), 0644)
	}
}

// Configura LightDM
func configureLightDM(root, user, session string) {
	lightdmDir := filepath.Join(root, "etc/lightdm")
	if _, err := os.Stat(lightdmDir); err != nil {
		return // LightDM non installato
	}

	fmt.Println(" -> Configurazione LightDM in corso...")

	// Rimuove regola PAM se esiste
	pamFile := filepath.Join(root, "etc/pam.d/lightdm-autologin")
	if data, err := os.ReadFile(pamFile); err == nil {
		lines := strings.Split(string(data), "\n")
		var newLines []string
		for _, line := range lines {
			if !strings.Contains(line, "pam_succeed_if.so") || !strings.Contains(line, "autologin") {
				newLines = append(newLines, line)
			}
		}
		os.WriteFile(pamFile, []byte(strings.Join(newLines, "\n")), 0644)
	}

	// Modifica lightdm.conf (aggiungendo sotto [Seat:*] o in fondo)
	confFile := filepath.Join(lightdmDir, "lightdm.conf")
	appendToFile(confFile, fmt.Sprintf("\n[Seat:*]\nautologin-user=%s\nautologin-user-timeout=0\nautologin-session=%s\n", user, session))
}

// Configura GDM / GDM3
func configureGDM(root, user string) {
	configs := []string{
		"etc/gdm3/daemon.conf",
		"etc/gdm3/custom.conf",
		"etc/gdm/custom.conf",
	}

	for _, relPath := range configs {
		fullPath := filepath.Join(root, relPath)
		if _, err := os.Stat(fullPath); err == nil {
			fmt.Printf(" -> Configurazione GDM trovata su %s...\n", relPath)

			// Leggiamo il file
			data, _ := os.ReadFile(fullPath)
			lines := strings.Split(string(data), "\n")
			var newLines []string

			daemonSectionFound := false

			for _, line := range lines {
				// Rimuoviamo vecchie chiavi autologin
				if strings.Contains(line, "AutomaticLoginEnable") || strings.Contains(line, "AutomaticLogin=") {
					continue
				}
				newLines = append(newLines, line)
				if strings.TrimSpace(line) == "[daemon]" {
					daemonSectionFound = true
					// Inseriamo subito sotto [daemon]
					newLines = append(newLines, fmt.Sprintf("AutomaticLoginEnable=true\nAutomaticLogin=%s", user))
				}
			}

			// Se [daemon] non c'era, lo aggiungiamo in cima
			if !daemonSectionFound {
				newLines = append([]string{"[daemon]", "AutomaticLoginEnable=true", "AutomaticLogin=" + user}, newLines...)
			}

			os.WriteFile(fullPath, []byte(strings.Join(newLines, "\n")), 0644)
		}
	}
}

// Helper per appendere testo a un file se esiste
func appendToFile(path, text string) {
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	f.WriteString(text)
}
