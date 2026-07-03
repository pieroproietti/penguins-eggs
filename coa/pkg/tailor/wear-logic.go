package tailor

import (
	"bufio"
	"coa/pkg/distro"
	"coa/pkg/utils"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

func logToFile(message string) {
	utils.LogNormal("%s", message)

	logPath := "/var/log/coa-tailor.log"
	f, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	f.WriteString(fmt.Sprintf("[%s] %s\n", timestamp, message))
}

func findYaml(costumePath string) string {
	fullPath := filepath.Join(costumePath, "index.yaml")
	if _, err := os.Stat(fullPath); err == nil {
		return fullPath
	}
	return ""
}

func loadSuit(yamlFile string) (*Suit, error) {
	if yamlFile == "" {
		return nil, fmt.Errorf("file 'index.yaml' not found")
	}

	data, err := os.ReadFile(yamlFile)
	if err != nil {
		return nil, err
	}

	var suit Suit
	if err := yaml.Unmarshal(data, &suit); err != nil {
		return nil, err
	}
	suit.normalize()

	return &suit, nil
}

func getAvailablePackages() map[string]struct{} {
	available := make(map[string]struct{})

	if _, err := exec.LookPath("apt-cache"); err != nil {
		return nil
	}

	logToFile("Updating available packages database...")
	cmd := exec.Command("/usr/bin/apt-cache", "pkgnames")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return available
	}

	if err := cmd.Start(); err != nil {
		return available
	}

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			available[line] = struct{}{}
		}
	}
	cmd.Wait()
	return available
}

func installWithRetries(packages []string, retries int) {
	installPackagesImpl(packages, retries, false)
}

// installNoRecommends installa pacchetti con --no-install-recommends,
// usato dai costume che dichiarano packages_no_install_recommends.
func installNoRecommends(packages []string) {
	installPackagesImpl(packages, 3, true)
}

func installPackagesImpl(packages []string, retries int, noRecommends bool) {
	if len(packages) == 0 {
		return
	}

	if _, err := exec.LookPath("apt-get"); err != nil {
		printAiPrompt(packages)
		return
	}

	available := getAvailablePackages()
	var toInstall []string
	var missing []string

	if available != nil {
		for _, pkg := range packages {
			if _, ok := available[pkg]; ok {
				toInstall = append(toInstall, pkg)
			} else {
				missing = append(missing, pkg)
			}
		}
	} else {
		toInstall = packages
	}

	if len(missing) > 0 {
		logToFile(fmt.Sprintf("WARNING: %d packages skipped (not found): %v", len(missing), missing))
	}

	if len(toInstall) == 0 {
		logToFile("No valid packages to install.")
		return
	}

	pkgString := strings.Join(toInstall, " ")
	flags := "-y"
	if noRecommends {
		flags = "-y --no-install-recommends"
	}
	cmd := fmt.Sprintf("DEBIAN_FRONTEND=noninteractive apt-get install %s %s", flags, pkgString)

	for i := 1; i <= retries; i++ {
		logToFile(fmt.Sprintf("Installation attempt %d of %d...", i, retries))
		if err := utils.Exec(cmd); err == nil {
			logToFile("✅ Package installation completed.")
			return
		}
		time.Sleep(2 * time.Second)
	}

	logToFile("❌ Critical error during package installation after all retries.")
}

func printAiPrompt(packages []string) {
	d := distro.NewDistro()
	logToFile(fmt.Sprintf("System %s detected (Non-Debian). Generating prompt and AIPrompt.txt file...", d.DistroLike))

	gpuCmd := "lspci -k | grep -A 2 -E 'VGA|3D'"
	gpuInfo, _ := exec.Command("sh", "-c", gpuCmd).Output()

	sessionCmd := "ls /usr/share/xsessions/ 2>/dev/null"
	sessions, _ := exec.Command("sh", "-c", sessionCmd).Output()

	var sb strings.Builder
	sb.WriteString("--- AI ASSISTANT PROMPT ---\n")
	sb.WriteString(fmt.Sprintf("I am using %s (base %s).\n", d.DistroID, d.DistroLike))
	sb.WriteString(fmt.Sprintf("I need to install and configure these packages:\n%s\n\n", strings.Join(packages, " ")))

	sb.WriteString("HARDWARE INFO (for video drivers and KMS):\n")
	if len(gpuInfo) > 0 {
		sb.WriteString(string(gpuInfo))
	} else {
		sb.WriteString("No VGA info found (pciutils not installed?).\n")
	}

	sb.WriteString("\nAVAILABLE DESKTOP SESSIONS:\n")
	if len(sessions) > 0 {
		sb.WriteString(string(sessions))
	} else {
		sb.WriteString("No sessions found in /usr/share/xsessions/\n")
	}

	sb.WriteString("\nPlease give me the exact command to install the equivalent packages on this distro and the steps needed to configure LightDM correctly.\n")
	sb.WriteString("----------------------------------------\n")

	promptContent := sb.String()

	utils.LogNormal("\n%s%s%s", utils.ColorCyan, promptContent, utils.ColorReset)

	userHome, _ := os.UserHomeDir()
	sudoUser := os.Getenv("SUDO_USER")
	if sudoUser != "" {
		userHome = filepath.Join("/home", sudoUser)
	}

	promptFile := filepath.Join(userHome, "AIPrompt.txt")
	err := os.WriteFile(promptFile, []byte(promptContent), 0644)

	if err != nil {
		logToFile(fmt.Sprintf("Error creating AIPrompt.txt: %v", err))
	} else {
		if sudoUser != "" {
			utils.Exec(fmt.Sprintf("sudo chown %s:%s %s", sudoUser, sudoUser, promptFile))
		}
		logToFile(fmt.Sprintf("✅ AIPrompt.txt file generated at: %s", promptFile))
		utils.LogNormal("Prompt file generated in Home: %s%s%s\n", utils.ColorYellow, promptFile, utils.ColorReset)
	}
}
