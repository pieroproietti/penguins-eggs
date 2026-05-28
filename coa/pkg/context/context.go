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

func isVirtual() bool {
	out, _ := exec.Command("systemd-detect-virt").Output()
	return strings.TrimSpace(string(out)) != "none"
}

func Detect() RuntimeContext {
	ctx := RuntimeContext{}

	// 1. Radice Progetto (più compatta)
	if ctx.ProjRoot = os.Getenv("GITHUB_WORKSPACE"); ctx.ProjRoot == "" {
		cwd, _ := os.Getwd()
		ctx.ProjRoot, _ = filepath.Abs(cwd)
		if filepath.Base(ctx.ProjRoot) == "coa" {
			ctx.ProjRoot = filepath.Dir(ctx.ProjRoot)
		}
	}
	ctx.OaDir, ctx.CoaDir = filepath.Join(ctx.ProjRoot, "oa"), filepath.Join(ctx.ProjRoot, "coa")

	// 2. Build Dir (One-liner con fallback)
	if ctx.BaseBuildDir = os.Getenv("OA_BUILD_DIR"); ctx.BaseBuildDir == "" {
		ctx.BaseBuildDir = "/tmp/oa-build-dir"
	}

	// 3. Assegnazione EnvType (Semplificata)
	switch {
	case os.Getenv("GITHUB_ACTIONS") == "true" || os.Getenv("CI") == "true":
		ctx.EnvType = EnvCI
	case isVirtual():
		ctx.EnvType = EnvVM
	default:
		ctx.EnvType = EnvHost
	}

	return ctx
}
