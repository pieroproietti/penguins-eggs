package builder

import (
	"coa/pkg/distro"
	"fmt"
	"os"
	"strconv"
	"strings"

	sysctx "coa/pkg/context" // <-- Il nostro cervello universale
)

func LogBuild(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	fmt.Printf("%s[build]%s %s\n", ColorBlue, ColorReset, msg)
}

func LogError(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	fmt.Printf("%s[ERROR]%s %s\n", ColorRed, ColorReset, msg)
}

// --------------------------------------

var AppVersion string

// HandleBuild coordina il packaging nativo.
// NON COMPILA PIU' NULLA: assembla i binari già forgiati dal Makefile.
func HandleBuild(d *distro.Distro, version string) {
	AppVersion = version
	baseVer, relNum := parseGitVersion(version)

	// 1. RILEVAMENTO AMBIENTE UNIVERSALE E PERCORSI
	ctx := sysctx.Detect()

	// Header pulito
	fmt.Printf("%s====================================================%s\n", ColorCyan, ColorReset)
	fmt.Printf("%s         COA BUILDER - Native Package Generation      %s\n", ColorCyan, ColorReset)
	fmt.Printf("%s====================================================%s\n", ColorCyan, ColorReset)

	LogBuild("Packaging version: %s", AppVersion)
	LogBuild("Environment detected: %s (fucina: %s)", ctx.EnvType, ctx.BaseBuildDir)

	// 2. Create /etc/oa-tools/custom.yaml
	// Rigeneriamo il file YAML con la versione corretta prima di pacchettizzarlo
	cleanVer := strings.TrimPrefix(baseVer, "v")
	fullVersion := fmt.Sprintf("%s-%s", cleanVer, relNum)
	CreateDefaultYAML(ctx, fullVersion)

	// 3. Routing verso i file specifici (I Sarti)
	LogBuild("Detected Distro Family: %s%s%s", ColorYellow, d.FamilyID, ColorReset)

	switch d.FamilyID {
	case "alpine":
		packAlpine(baseVer, relNum, ctx)
	case "archlinux":
		packArch(baseVer, relNum, ctx)
	case "manjaro":
		packManjaro(baseVer, relNum, ctx)
	case "fedora", "rhel", "centos", "rocky", "almalinux":
		packFedora(baseVer, relNum, ctx)
	case "opensuse":
		packOpenSUSE(baseVer, relNum, ctx)
	default:
		LogBuild("Falling back to Debian/Generic packaging...")
		packDebian(baseVer, relNum, ctx)
	}
}

func parseGitVersion(v string) (string, string) {
	// 1. Togliamo la 'v' iniziale se presente
	cleanV := strings.TrimPrefix(v, "v")
	parts := strings.Split(cleanV, "-")

	baseVer := parts[0]
	relNum := "1"

	// 2. Isoliamo la release
	if len(parts) > 1 {
		if _, err := strconv.Atoi(parts[1]); err == nil {
			// Se è un numero puro (es. 195), è il nostro pkgrel
			relNum = parts[1]
		}
	}

	// 3. PULIZIA UNIVERSALE (Per Arch, Fedora, Alpine)
	baseVer = strings.ReplaceAll(baseVer, "-", ".")
	baseVer = strings.ReplaceAll(baseVer, "_", ".")

	// 4. Fix storico per Debian
	if len(baseVer) > 0 && (baseVer[0] < '0' || baseVer[0] > '9') {
		baseVer = "0~" + baseVer
	}

	return baseVer, relNum
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0644)
}
