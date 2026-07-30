// worker/autologin.go
package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coa/pkg/utils"
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

	utils.LogNormal("Running autologin-gui for user '%s'", user)

	session := findPreferredSession(root)
	utils.LogNormal("Desktop session detected: %s", session)

	configureSDDM(root, user, session)
	configureLightDM(root, user, session)
	configureGDM(root, user)
	configureMDM(root, user)
	configureLXDM(root, user)
	configureSLIM(root, user)
	configureGreetd(root, user)

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
		utils.LogNormal("Configuring SDDM autologin...")
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

	utils.LogNormal("Configuring LightDM autologin...")
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
			utils.LogNormal("GDM configuration found at %s...", relPath)
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

func configureMDM(root, user string) {
	mdmPath := filepath.Join(root, "etc/mdm/mdm.conf")
	if _, err := os.Stat(mdmPath); err == nil {
		utils.LogNormal("Configuring MDM autologin...")
		data, _ := os.ReadFile(mdmPath)
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

		os.WriteFile(mdmPath, []byte(strings.Join(newLines, "\n")), 0644)
	}
}

func configureLXDM(root, user string) {
	lxdmPath := filepath.Join(root, "etc/lxdm/lxdm.conf")
	if _, err := os.Stat(lxdmPath); err == nil {
		utils.LogNormal("Configuring LXDM autologin...")
		data, _ := os.ReadFile(lxdmPath)
		lines := strings.Split(string(data), "\n")
		found := false
		for i, line := range lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, "autologin=") || strings.HasPrefix(trimmed, "# autologin=") || strings.HasPrefix(trimmed, "#autologin=") {
				lines[i] = "autologin=" + user
				found = true
				break
			}
		}
		if !found {
			var newLines []string
			inserted := false
			for _, line := range lines {
				newLines = append(newLines, line)
				if strings.TrimSpace(line) == "[base]" {
					newLines = append(newLines, "autologin="+user)
					inserted = true
				}
			}
			if !inserted {
				newLines = append([]string{"[base]", "autologin=" + user}, newLines...)
			}
			lines = newLines
		}
		os.WriteFile(lxdmPath, []byte(strings.Join(lines, "\n")), 0644)
	}
}

func configureSLIM(root, user string) {
	slimPath := filepath.Join(root, "etc/slim.conf")
	if _, err := os.Stat(slimPath); err == nil {
		utils.LogNormal("Configuring SLiM autologin...")
		data, _ := os.ReadFile(slimPath)
		lines := strings.Split(string(data), "\n")
		userFound, autoFound := false, false
		for i, line := range lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, "default_user") || strings.HasPrefix(trimmed, "#default_user") || strings.HasPrefix(trimmed, "# default_user") {
				lines[i] = "default_user " + user
				userFound = true
			} else if strings.HasPrefix(trimmed, "auto_login") || strings.HasPrefix(trimmed, "#auto_login") || strings.HasPrefix(trimmed, "# auto_login") {
				lines[i] = "auto_login yes"
				autoFound = true
			}
		}
		if !userFound {
			lines = append(lines, "default_user "+user)
		}
		if !autoFound {
			lines = append(lines, "auto_login yes")
		}
		os.WriteFile(slimPath, []byte(strings.Join(lines, "\n")), 0644)
	}
}

func configureGreetd(root, user string) {
	greetdPath := filepath.Join(root, "etc/greetd/config.toml")
	if _, err := os.Stat(greetdPath); err == nil {
		utils.LogNormal("Configuring greetd autologin...")
		data, _ := os.ReadFile(greetdPath)
		lines := strings.Split(string(data), "\n")
		var newLines []string
		inInitial := false
		userSet := false

		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, "[") && strings.HasSuffix(trimmed, "]") {
				if inInitial && !userSet {
					newLines = append(newLines, fmt.Sprintf("user = \"%s\"", user))
					userSet = true
				}
				inInitial = (trimmed == "[initial_session]")
			} else if inInitial && strings.HasPrefix(trimmed, "user") {
				newLines = append(newLines, fmt.Sprintf("user = \"%s\"", user))
				userSet = true
				continue
			}
			newLines = append(newLines, line)
		}
		if inInitial && !userSet {
			newLines = append(newLines, fmt.Sprintf("user = \"%s\"", user))
			userSet = true
		}
		if !userSet {
			newLines = append(newLines, "\n[initial_session]", fmt.Sprintf("user = \"%s\"", user))
		}
		os.WriteFile(greetdPath, []byte(strings.Join(newLines, "\n")), 0644)
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


