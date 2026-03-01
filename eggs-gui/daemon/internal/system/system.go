package system

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
)

// VersionInfo holds version information for system components.
type VersionInfo struct {
	Eggs      string `json:"eggs"`
	Calamares string `json:"calamares"`
	Distro    string `json:"distro"`
	Kernel    string `json:"kernel"`
}

// DepsCheck holds dependency check results.
type DepsCheck struct {
	EggsInstalled      bool `json:"eggsInstalled"`
	CalamaresInstalled bool `json:"calamaresInstalled"`
	ConfigExists       bool `json:"configExists"`
}

// GetVersions detects installed versions of eggs, calamares, and system info.
func GetVersions() VersionInfo {
	return VersionInfo{
		Eggs:      getEggsVersion(),
		Calamares: getCalamaresVersion(),
		Distro:    getDistroInfo(),
		Kernel:    getKernelVersion(),
	}
}

// CheckDeps verifies that required dependencies are installed.
func CheckDeps() DepsCheck {
	return DepsCheck{
		EggsInstalled:      packageIsInstalled("eggs") || packageIsInstalled("penguins-eggs"),
		CalamaresInstalled: packageIsInstalled("calamares"),
		ConfigExists:       dirExists("/etc/penguins-eggs.d"),
	}
}

// ListThemes returns available wardrobe vendor themes.
func ListThemes() []string {
	home, err := os.UserHomeDir()
	if err != nil {
		return []string{"eggs"}
	}

	vendorsPath := filepath.Join(home, ".wardrobe", "vendors")
	entries, err := os.ReadDir(vendorsPath)
	if err != nil {
		return []string{"eggs"}
	}

	themes := []string{"eggs"}
	for _, e := range entries {
		if e.IsDir() {
			themes = append(themes, e.Name())
		}
	}
	sort.Strings(themes[1:])
	return themes
}

// ListDesktopApps returns available .desktop application names.
func ListDesktopApps() []string {
	entries, err := os.ReadDir("/usr/share/applications")
	if err != nil {
		return nil
	}

	var apps []string
	for _, e := range entries {
		name := e.Name()
		if strings.HasSuffix(name, ".desktop") {
			apps = append(apps, strings.TrimSuffix(name, ".desktop"))
		}
	}
	sort.Strings(apps)
	return apps
}

func getEggsVersion() string {
	out, err := exec.Command("eggs", "version").Output()
	if err != nil {
		// Try alternative detection
		out, err = exec.Command("eggs", "--version").Output()
		if err != nil {
			return "N/A"
		}
	}
	return strings.TrimSpace(string(out))
}

func getCalamaresVersion() string {
	out, err := exec.Command("calamares", "--version").Output()
	if err != nil {
		// Try dpkg
		out, err = exec.Command("dpkg", "-s", "calamares").Output()
		if err != nil {
			return "N/A"
		}
		for _, line := range strings.Split(string(out), "\n") {
			if strings.HasPrefix(line, "Version:") {
				return strings.TrimSpace(strings.TrimPrefix(line, "Version:"))
			}
		}
		return "N/A"
	}
	return strings.TrimSpace(string(out))
}

func getDistroInfo() string {
	data, err := os.ReadFile("/etc/os-release")
	if err != nil {
		return runtime.GOOS
	}
	for _, line := range strings.Split(string(data), "\n") {
		if strings.HasPrefix(line, "PRETTY_NAME=") {
			name := strings.TrimPrefix(line, "PRETTY_NAME=")
			return strings.Trim(name, "\"")
		}
	}
	return runtime.GOOS
}

func getKernelVersion() string {
	out, err := exec.Command("uname", "-r").Output()
	if err != nil {
		return "N/A"
	}
	return strings.TrimSpace(string(out))
}

func packageIsInstalled(pkg string) bool {
	// Check Arch (pacman)
	if _, err := os.Stat("/usr/bin/pacman"); err == nil {
		err := exec.Command("pacman", "-Q", pkg).Run()
		return err == nil
	}

	// Check Debian (dpkg)
	out, err := exec.Command("dpkg", "-s", pkg).Output()
	if err != nil {
		return false
	}
	return strings.Contains(string(out), "Status: install ok installed")
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}
