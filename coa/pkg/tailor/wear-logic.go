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

// installWithRetries installs packages, falling back to one-by-one
// installation on bulk failure so a single broken package does not
// prevent the rest from being installed. Returns the packages that
// could not be installed (including any not found in apt's cache),
// so the caller can report them to the user.
func installWithRetries(packages []string, retries int) []string {
	return installPackagesImpl(packages, retries, false)
}

// installNoRecommends installs packages with --no-install-recommends.
// Returns the packages that could not be installed.
func installNoRecommends(packages []string) []string {
	return installPackagesImpl(packages, 3, true)
}

func installPackagesImpl(packages []string, retries int, noRecommends bool) []string {
	if len(packages) == 0 {
		return nil
	}

	if _, err := exec.LookPath("apt-get"); err != nil {
		printAiPrompt(packages)
		return nil
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
		return missing
	}

	pkgString := strings.Join(toInstall, " ")
	flags := "-y"
	if noRecommends {
		flags = "-y --no-install-recommends"
	}

	// readline: accepts low-priority defaults automatically but shows
	// critical prompts (e.g. firmware license agreements) to the user.
	// Dpkg::Use-Pty=0: apt normally runs dpkg inside its own internal
	// pseudo-terminal so it can both show the output live and log a copy
	// to /var/log/apt/term.log. That mirroring has known bugs (Debian
	// #765687, #860931) where the copy written to term.log succeeds but
	// the live mirror to the real terminal is silently dropped -- the
	// user never sees the prompt (or sees it truncated, e.g. "[Más]"
	// glued to the next shell prompt) even though stdin/stdout are
	// correctly wired to a real tty. Disabling apt's internal pty makes
	// dpkg/debconf inherit our own stdio directly instead, which is the
	// documented workaround for this class of bug.
	cmd := fmt.Sprintf("DEBIAN_FRONTEND=readline apt-get install -o Dpkg::Options::='--force-confold' -o Dpkg::Use-Pty=0 %s %s", flags, pkgString)

	logToFile(fmt.Sprintf("Installing %d packages in bulk...", len(toInstall)))
	if err := utils.Exec(cmd); err == nil {
		logToFile("✅ Package installation completed.")
		return missing
	}

	// Fallback: install one by one so a single broken package does not
	// prevent the rest from being installed. Packages that still fail
	// after `retries` individual attempts are given up on and reported.
	logToFile("⚠️  Bulk install failed. Retrying package by package to isolate failures...")
	pending := toInstall
	for attempt := 1; attempt <= retries && len(pending) > 0; attempt++ {
		var stillFailing []string
		for _, pkg := range pending {
			singleCmd := fmt.Sprintf("DEBIAN_FRONTEND=readline apt-get install -o Dpkg::Options::='--force-confold' -o Dpkg::Use-Pty=0 %s %s", flags, pkg)
			if err := utils.Exec(singleCmd); err != nil {
				stillFailing = append(stillFailing, pkg)
			}
		}
		pending = stillFailing
		if len(pending) > 0 && attempt < retries {
			logToFile(fmt.Sprintf("⚠️  %d packages still failing after attempt %d/%d, retrying: %v", len(pending), attempt, retries, pending))
		}
	}

	if len(pending) > 0 {
		logToFile(fmt.Sprintf("⚠️  %d packages could not be installed: %v", len(pending), pending))
	} else {
		logToFile("✅ All packages installed successfully (one by one).")
	}

	return append(missing, pending...)
}

// installInteractive installs packages without suppressing debconf prompts.
// Use this for packages that require user interaction (e.g. license acceptance).
// Dpkg::Use-Pty=0 avoids apt's internal pty-mirroring bug that can drop the
// live prompt from the real terminal (see the comment in installPackagesImpl).
// Returns the packages that could not be installed (missing from apt's
// cache, or the whole batch if the bulk apt-get call failed -- interactive
// packages are typically few and license-related, so we don't attempt the
// one-by-one isolation used for regular packages).
func installInteractive(packages []string) []string {
	if len(packages) == 0 {
		return nil
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
		logToFile(fmt.Sprintf("WARNING: %d interactive packages skipped (not found): %v", len(missing), missing))
	}

	if len(toInstall) == 0 {
		return missing
	}

	pkgString := strings.Join(toInstall, " ")
	cmd := fmt.Sprintf("apt-get install -o Dpkg::Options::='--force-confold' -o Dpkg::Use-Pty=0 -y %s", pkgString)
	logToFile(fmt.Sprintf("Installing interactive packages: %s", pkgString))
	if err := utils.Exec(cmd); err != nil {
		logToFile(fmt.Sprintf("⚠️  Some interactive packages could not be installed: %v", err))
		return append(missing, toInstall...)
	}
	return missing
}

// removePackages removes packages that the vendor does not want on the system.
// Errors are logged but do not abort the process -- a package may simply
// not be installed on this particular machine.
func removePackages(packages []string) {
	if len(packages) == 0 {
		return
	}

	pkgString := strings.Join(packages, " ")
	cmd := fmt.Sprintf("DEBIAN_FRONTEND=readline apt-get remove -o Dpkg::Options::='--force-confold' -o Dpkg::Use-Pty=0 -y %s", pkgString)
	logToFile(fmt.Sprintf("Removing packages: %s", pkgString))
	if err := utils.Exec(cmd); err != nil {
		logToFile(fmt.Sprintf("⚠️  Some packages could not be removed (may not be installed): %v", err))
	}

	utils.Exec("DEBIAN_FRONTEND=readline apt-get autoremove -o Dpkg::Use-Pty=0 -y")
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
			utils.Exec(fmt.Sprintf("chown %s:%s %s", sudoUser, sudoUser, promptFile))
		}
		logToFile(fmt.Sprintf("✅ AIPrompt.txt file generated at: %s", promptFile))
		utils.LogNormal("Prompt file generated in Home: %s%s%s\n", utils.ColorYellow, promptFile, utils.ColorReset)
	}
}
