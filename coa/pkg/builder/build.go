package builder

import (
	"coa/pkg/distro"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
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

// HandleBuild coordina la compilazione e delega il packaging ai file specifici
func HandleBuild(d *distro.Distro, version string) {
	AppVersion = version
	baseVer, relNum := parseGitVersion(version)

	// 1. RILEVAMENTO AMBIENTE UNIVERSALE E PERCORSI
	ctx := sysctx.Detect()

	// Header pulito
	fmt.Printf("%s====================================================%s\n", ColorCyan, ColorReset)
	fmt.Printf("%s         COA BUILDER - Native Package Generation      %s\n", ColorCyan, ColorReset)
	fmt.Printf("%s====================================================%s\n", ColorCyan, ColorReset)

	LogBuild("Building version: %s", AppVersion)
	LogBuild("Environment detected: %s (fucina: %s)", ctx.EnvType, ctx.BaseBuildDir)

	// 2. Compilazione motore C (Il Braccio)
	LogBuild("Compiling Engine (oa)...")
	// Passiamo BUILD_DIR al make per forzarlo nella fucina calcolata dal contesto
	makeCmd := exec.Command("make", "-C", ctx.OaDir, fmt.Sprintf("VERSION=%s", AppVersion), fmt.Sprintf("BUILD_DIR=%s", ctx.BaseBuildDir), "clean", "all")
	makeCmd.Stdout, makeCmd.Stderr = os.Stdout, os.Stderr
	if err := makeCmd.Run(); err != nil {
		LogError("Engine compilation failed: %v", err)
		return
	}

	// 3. Compilazione orchestratore Go (La Mente)
	LogBuild("Compiling Orchestrator (coa)...")
	ldflags := fmt.Sprintf("-X 'coa/pkg/cmd.AppVersion=%s'", AppVersion)

	var outputPath string
	if ctx.EnvType == sysctx.EnvCI {
		// In CI il binario rimane nella sua cartella d'origine per evitare problemi
		outputPath = filepath.Join(ctx.CoaDir, "coa")
	} else {
		// Sotto Vagrant, VM o Host, deviamo rigorosamente nella fucina in RAM
		outputPath = filepath.Join(ctx.BaseBuildDir, "coa", "coa")
		os.MkdirAll(filepath.Dir(outputPath), 0755)
	}

	goCmd := exec.Command("go", "build", "-ldflags", ldflags, "-o", outputPath, "main.go")
	goCmd.Dir = ctx.CoaDir // Manteniamo la working directory sui sorgenti
	goCmd.Stdout, goCmd.Stderr = os.Stdout, os.Stderr
	if err := goCmd.Run(); err != nil { // Aggiunto il controllo errore vitale!
		LogError("Orchestrator compilation failed: %v", err)
		return
	}

	// 4. Generazione Documentazione
	LogBuild("Generating documentation and completions...")
	if err := generateDocs(ctx); err != nil { // Passiamo solo il contesto!
		LogError("Docs generation failed: %v", err)
		return
	}

	// 5. Routing verso i file specifici (I Sarti)
	LogBuild("Detected Distro Family: %s%s%s", ColorYellow, d.FamilyID, ColorReset)

	switch d.FamilyID {
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
		pkgVersion := fmt.Sprintf("%s-%s", baseVer, relNum)
		packDebian(pkgVersion, ctx)
	}
}

// Utility condivise

func parseGitVersion(v string) (string, string) {
	cleanV := strings.TrimPrefix(v, "v")
	parts := strings.Split(cleanV, "-")

	baseVer := parts[0]
	relNum := "1"

	if len(parts) > 1 {
		relNum = parts[1]
	}

	// Fix per Debian
	if len(baseVer) > 0 && (baseVer[0] < '0' || baseVer[0] > '9') {
		baseVer = "0~" + baseVer
	}

	return baseVer, relNum
}

func generateDocs(ctx sysctx.RuntimeContext) error {
	// 1. REGOLA UNIVERSALE: I documenti nascono SEMPRE nella fucina!
	// Nessuna distinzione tra Vagrant, Local o CI. Tutto va in BaseBuildDir.
	docPath := filepath.Join(ctx.BaseBuildDir, "docs")
	os.MkdirAll(docPath, 0755)

	// Identifichiamo dove si trova il binario appena compilato
	var coaBin string
	if ctx.EnvType == sysctx.EnvCI {
		coaBin = filepath.Join(ctx.CoaDir, "coa")
	} else {
		coaBin = filepath.Join(ctx.BaseBuildDir, "coa", "coa")
	}

	// Lanciamo il comando sul target sicuro
	genCmd := exec.Command(coaBin, "_gen_docs", "--target", docPath)
	genCmd.Dir = ctx.CoaDir
	genCmd.Stdout, genCmd.Stderr = os.Stdout, os.Stderr

	return genCmd.Run()
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0644)
}
