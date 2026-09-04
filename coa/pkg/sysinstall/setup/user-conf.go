package setup

import (
	"bufio"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// UserConfig contains the data to inject into the YAML template
type UserConfig struct {
	Date               string
	Groups             []string
	AdminGroup         string
	AllowWeakPasswords bool
	DefaultHostname    string
}

func userConf() error {
	targetPath := filepath.Join(InstallerDRoot, "modules", "users.conf")
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return err
	}

	// 1. Identify the live user
	liveUser := os.Getenv("SUDO_USER")
	if liveUser == "" || liveUser == "root" {
		liveUser = "live"
	}

	// 2. Read the real groups
	cmd := exec.Command("id", "-Gn", liveUser)
	out, err := cmd.Output()

	var validGroups []string
	adminGroup := "wheel" // Universal default

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
		// Emergency fallback
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

	// 3. The "require strong passwords" checkbox is visible by default.
	allowWeakPasswords := true

	// 4. Read default hostname from /etc/hostname if present, fallback to ${host}
	defaultHostname := "${host}"
	if data, err := os.ReadFile("/etc/hostname"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			h := strings.TrimSpace(line)
			if h != "" && !strings.HasPrefix(h, "#") && h != "live-system" && h != "localhost" {
				defaultHostname = h
				break
			}
		}
	}

	// 5. Build the data structure
	config := UserConfig{
		Date:               time.Now().Format("2006-01-02"),
		Groups:             validGroups,
		AdminGroup:         adminGroup,
		AllowWeakPasswords: allowWeakPasswords,
		DefaultHostname:    defaultHostname,
	}

	// 6. Write using the template
	return renderAndSaveEmbedded("users.conf.tmpl", targetPath, config, 0644)
}

// firstHumanUser finds the first real (non-system) user in /etc/passwd:
// UID between 1000 and 59999, with a valid login shell.
func firstHumanUser() *struct{ HomeDir string } {
	f, err := os.Open("/etc/passwd")
	if err != nil {
		return nil
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		fields := strings.Split(scanner.Text(), ":")
		if len(fields) < 7 {
			continue
		}
		uid, err := strconv.Atoi(fields[2])
		if err != nil || uid < 1000 || uid >= 60000 {
			continue
		}
		shell := fields[6]
		if strings.HasSuffix(shell, "nologin") || strings.HasSuffix(shell, "/false") {
			continue
		}
		return &struct{ HomeDir string }{HomeDir: "/home/" + fields[0]}
	}
	return nil
}
