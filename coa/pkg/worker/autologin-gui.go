// worker/autologin.go
package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func RunAutologin(payload []byte) error {
	var config struct {
		LiveRoot string `json:"live_root,omitempty"`
		Params   struct {
			User string `json:"user"`
		} `json:"params"`
	}

	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("JSON parsing error for autologin-gui module: %w", err)
	}

	root := config.LiveRoot
	user := config.Params.User

	if user == "" {
		user = "live"
	}

	fmt.Printf("📦 [worker] Running autologin-gui for user '%s'\n", user)



	session := findPreferredSession(root)
	fmt.Printf(" -> Desktop session detected: %s\n", session)
	configureSDDM(root, user, session)
	configureLightDM(root, user, session)
	configureGDM(root, user)

	return nil
}

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

func configureSDDM(root, user, session string) {
	sddmShare := filepath.Join(root, "usr/share/sddm")
	sddmEtc := filepath.Join(root, "etc/sddm.conf.d")

	if _, err := os.Stat(sddmShare); err == nil {
		fmt.Println(" -> Configuring SDDM...")
		os.MkdirAll(sddmEtc, 0755)
		confPath := filepath.Join(sddmEtc, "autologin.conf")
		content := fmt.Sprintf("[Autologin]\nUser=%s\nSession=%s\nRelogin=false\n", user, session)
		os.WriteFile(confPath, []byte(content), 0644)
	}
}

func configureLightDM(root, user, session string) {
	lightdmDir := filepath.Join(root, "etc/lightdm")
	if _, err := os.Stat(lightdmDir); err != nil {
		return
	}

	fmt.Println(" -> Configuring LightDM...")
	pamFile := filepath.Join(root, "etc/pam.d/lightdm-autologin")
	if data, err := os.ReadFile(pamFile); err == nil {
		bypass := "auth\tsufficient\tpam_permit.so"
		if !strings.Contains(string(data), bypass) {
			newData := bypass + "\n" + string(data)
			os.WriteFile(pamFile, []byte(newData), 0644)
		}
	}

	confFile := filepath.Join(lightdmDir, "lightdm.conf")
	appendToFile(confFile, fmt.Sprintf("\n[Seat:*]\nautologin-user=%s\nautologin-user-timeout=0\nautologin-session=%s\n", user, session))
}

func configureGDM(root, user string) {
	configs := []string{
		"etc/gdm3/daemon.conf",
		"etc/gdm3/custom.conf",
		"etc/gdm/custom.conf",
	}

	for _, relPath := range configs {
		fullPath := filepath.Join(root, relPath)
		if _, err := os.Stat(fullPath); err == nil {
			fmt.Printf(" -> GDM configuration found at %s...\n", relPath)
			data, _ := os.ReadFile(fullPath)
			lines := strings.Split(string(data), "\n")
			var newLines []string

			daemonSectionFound := false

			for _, line := range lines {
				if strings.Contains(line, "AutomaticLoginEnable") || strings.Contains(line, "AutomaticLogin=") {
					continue
				}
				newLines = append(newLines, line)
				if strings.TrimSpace(line) == "[daemon]" {
					daemonSectionFound = true
					newLines = append(newLines, fmt.Sprintf("AutomaticLoginEnable=true\nAutomaticLogin=%s", user))
				}
			}

			if !daemonSectionFound {
				newLines = append([]string{"[daemon]", "AutomaticLoginEnable=true", "AutomaticLogin=" + user}, newLines...)
			}

			os.WriteFile(fullPath, []byte(strings.Join(newLines, "\n")), 0644)
		}
	}
}

func appendToFile(path, text string) {
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	f.WriteString(text)
}

