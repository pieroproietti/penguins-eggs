package context

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// I quattro ambienti ufficiali di oa-tools
const (
	EnvCI   = "ci"   // Docker / GitHub Actions
	EnvVM   = "vm"   // Macchina virtuale pura (KVM/QEMU)
	EnvHost = "host" // Hardware reale (colibri)
)

// RuntimeContext contiene la mappa geopolitica e i percorsi dell'esecuzione attuale
type RuntimeContext struct {
	EnvType      string // ci, vm, host
	ProjRoot     string // Radice della repository
	OaDir        string // Cartella sorgenti C
	CoaDir       string // Cartella sorgenti Go
	BaseBuildDir string // Fucina per la compilazione dei binari (RAM o Workspace)
	ZstdLevel    int    // Livello di compressione squashfs ottimizzato
}

// Detect analizza l'ambiente e restituisce la configurazione universale
func Detect() RuntimeContext {
	ctx := RuntimeContext{}

	// 1. Calcolo dinamico della radice del progetto e delle sue appendici
	cwd, _ := os.Getwd()
	ctx.ProjRoot = cwd
	if filepath.Base(cwd) == "coa" {
		ctx.ProjRoot = filepath.Dir(cwd)
	}
	ctx.OaDir = filepath.Join(ctx.ProjRoot, "oa")
	ctx.CoaDir = filepath.Join(ctx.ProjRoot, "coa")

	// 2. Rilevamento indicatori hardware/software
	isCI := os.Getenv("GITHUB_ACTIONS") == "true" || os.Getenv("CI") == "true"

	// 3. Controllo presenza virtualizzazione (Per distinguere VM da Host fisico)
	isVirtual := true
	out, err := exec.Command("systemd-detect-virt").Output()
	if err == nil {
		if strings.TrimSpace(string(out)) == "none" {
			isVirtual = false
		}
	} else {
		// Fallback se systemd-detect-virt manca
		if data, err := os.ReadFile("/sys/class/dmi/id/product_name"); err == nil {
			prod := strings.ToLower(string(data))
			if !strings.Contains(prod, "kvm") && !strings.Contains(prod, "qemu") && !strings.Contains(prod, "virtualbox") {
				isVirtual = false
			}
		}
	}

	// 4. Assegnazione delle regole d'ingaggio e smistamento fucine
	ctx.BaseBuildDir = "/tmp/oa-build-dir"
	switch {
	case isCI:
		ctx.EnvType = EnvCI

	case isVirtual:
		ctx.EnvType = EnvVM

	default:
		ctx.EnvType = EnvHost
	}

	return ctx
}
