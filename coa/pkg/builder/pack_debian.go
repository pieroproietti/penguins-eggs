package builder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	sysctx "coa/pkg/context"
)

// packDebian costruisce il pacchetto per sistemi basati su Debian (.deb)
func packDebian(baseVer string, relNum string, ctx sysctx.RuntimeContext) {
	// Pulizia della versione e creazione del formato Debian (es. 0.7.9-1)
	cleanVer := strings.TrimPrefix(baseVer, "v")
	fullVersion := fmt.Sprintf("%s-%s", cleanVer, relNum)

	pkgName := fmt.Sprintf("oa-tools_%s_amd64", fullVersion)

	LogBuild("Iniziando il pacchettizzamento per Debian/Ubuntu...")

	// 1. Il tavolo da lavoro è la stanza sterile definita dal Contesto (es. /tmp/oa-build-dir)
	buildDir := filepath.Join(ctx.BaseBuildDir, pkgName)
	os.RemoveAll(buildDir)

	// 2. Creazione struttura directory standard Debian
	dirs := []string{
		filepath.Join(buildDir, "DEBIAN"),
		filepath.Join(buildDir, "usr/bin"),
		filepath.Join(buildDir, "etc/oa-tools.d/brain.d"),
		filepath.Join(buildDir, "usr/share/man/man1"),
		filepath.Join(buildDir, "usr/share/bash-completion/completions"),
		filepath.Join(buildDir, "usr/share/zsh/vendor-completions"),
		filepath.Join(buildDir, "usr/share/fish/vendor_completions.d"),
	}
	for _, dir := range dirs {
		os.MkdirAll(dir, 0755)
	}

	// ---------------------------------------------------------
	// 3. INSTALLAZIONE BINARI (Prelevati dalla Stanza Sterile!)
	// ---------------------------------------------------------
	binPath := filepath.Join(buildDir, "usr/bin")

	// Prende 'oa' da /tmp/oa-build-dir/oa invece che dai sorgenti
	if err := copyFile(filepath.Join(ctx.BaseBuildDir, "oa"), filepath.Join(binPath, "oa")); err != nil {
		LogError("⚠️ ERRORE: Impossibile copiare il binario 'oa' dalla build dir: %v", err)
	}

	// Prende 'coa' da /tmp/oa-build-dir/coa invece che dai sorgenti
	if err := copyFile(filepath.Join(ctx.BaseBuildDir, "coa"), filepath.Join(binPath, "coa")); err != nil {
		LogError("⚠️ ERRORE: Impossibile copiare il binario 'coa' dalla build dir: %v", err)
	}

	os.Chmod(filepath.Join(binPath, "oa"), 0755)
	os.Chmod(filepath.Join(binPath, "coa"), 0755)

	// Creazione del symlink di legacy/compatibilità per 'eggs'
	os.Symlink("coa", filepath.Join(binPath, "eggs"))

	// 4. Gestione della Configurazione YAML e Popolamento brain.d (Dai Sorgenti)
	confDest := filepath.Join(buildDir, "etc/oa-tools.d")
	brainDest := filepath.Join(confDest, "brain.d")

	defaultName := "custom.yaml"
	defaultSrc := filepath.Join(ctx.ProjRoot, "etc", "oa-tools.d", defaultName)
	defaultDest := filepath.Join(confDest, defaultName)

	input, err := os.ReadFile(defaultSrc)
	if err == nil {
		os.WriteFile(defaultDest, input, 0644)
	} else {
		fmt.Printf("Attenzione: impossibile leggere %s: %v\n", defaultSrc, err)
		os.Exit(1)
	}

	// brain.d rimane un sorgente, quindi usiamo ctx.ProjRoot
	brainSrc := filepath.Join(ctx.ProjRoot, "coa", "brain.d")
	srcPath := brainSrc + string(filepath.Separator) + "."

	cmd := exec.Command("cp", "-a", srcPath, brainDest)
	if err := cmd.Run(); err != nil {
		fmt.Printf("Errore critico durante il popolamento di %s: %v\n", brainDest, err)
		os.Exit(1)
	}

	// ---------------------------------------------------------
	// 5. ORIGINE DOCUMENTI (Dalla Root del progetto generata dal Makefile)
	// ---------------------------------------------------------
	docSourceDir := filepath.Join(ctx.ProjRoot, "docs")
	manDir := filepath.Join(buildDir, "usr/share/man/man1")
	exec.Command("sh", "-c", fmt.Sprintf("cp %s/man/*.1 %s/ 2>/dev/null && gzip -9 %s/*.1 2>/dev/null", docSourceDir, manDir, manDir)).Run()

	// ---------------------------------------------------------
	// 6. Completamenti shell e alias (Generati freschi da Cobra)
	// ---------------------------------------------------------
	bashCompDir := filepath.Join(buildDir, "usr/share/bash-completion/completions")
	zshCompDir := filepath.Join(buildDir, "usr/share/zsh/vendor-completions")
	fishCompDir := filepath.Join(buildDir, "usr/share/fish/vendor_completions.d")

	runCoa := filepath.Join(binPath, "coa")

	// BASH
	bashOut, err := exec.Command(runCoa, "completion", "bash").CombinedOutput()
	if err != nil {
		LogError("⚠️ FALLIMENTO BASH COMPLETION: %v | Output: %s", err, string(bashOut))
	} else {
		os.WriteFile(filepath.Join(bashCompDir, "coa"), bashOut, 0644)
		eggsBashOut := strings.ReplaceAll(string(bashOut), " coa", " eggs")
		eggsBashOut = strings.ReplaceAll(eggsBashOut, "__start_coa", "__start_eggs")
		os.WriteFile(filepath.Join(bashCompDir, "eggs"), []byte(eggsBashOut), 0644)
	}

	// ZSH
	zshOut, err := exec.Command(runCoa, "completion", "zsh").CombinedOutput()
	if err != nil {
		LogError("⚠️ FALLIMENTO ZSH COMPLETION: %v | Output: %s", err, string(zshOut))
	} else {
		os.WriteFile(filepath.Join(zshCompDir, "_coa"), zshOut, 0644)
		os.Symlink("_coa", filepath.Join(zshCompDir, "_eggs"))
	}

	// FISH
	fishOut, err := exec.Command(runCoa, "completion", "fish").CombinedOutput()
	if err != nil {
		LogError("⚠️ FALLIMENTO FISH COMPLETION: %v | Output: %s", err, string(fishOut))
	} else {
		os.WriteFile(filepath.Join(fishCompDir, "coa.fish"), fishOut, 0644)
		os.Symlink("coa.fish", filepath.Join(fishCompDir, "eggs.fish"))
	}

	// 7. Generazione file control
	controlContent := fmt.Sprintf(`Package: oa-tools
Version: %s
Architecture: amd64
Maintainer: Piero Proietti <piero.proietti@gmail.com>
Depends: squashfs-tools, xorriso, live-boot, live-boot-initramfs-tools, dosfstools, mtools, rsync, git, sudo, grub-pc-bin, grub-efi-amd64-bin, jq
Conflicts: penguins-eggs
Description: coa is the mind and oa the arm
`, fullVersion)

	os.WriteFile(filepath.Join(buildDir, "DEBIAN", "control"), []byte(controlContent), 0644)

	// 8. Impacchettamento con dpkg-deb nella stanza sterile
	debFile := pkgName + ".deb"
	tmpDebLocation := filepath.Join(ctx.BaseBuildDir, debFile)

	dpkgCmd := exec.Command("dpkg-deb", "--root-owner-group", "--build", buildDir, tmpDebLocation)
	dpkgCmd.Stdout, dpkgCmd.Stderr = os.Stdout, os.Stderr
	if err := dpkgCmd.Run(); err != nil {
		LogError("Failed to build Debian package: %v", err)
		return
	}

	// 9. Destinazione finale simmetrica guidata dal Contesto
	switch ctx.EnvType {
	case sysctx.EnvCI:
		LogBuild("[CI Mode] Pacchetto Debian rilasciato nel workspace: %s", tmpDebLocation)
		// In CI assicuriamoci comunque che atterri nella ProjRoot per l'upload degli artifact
		finalTarget := filepath.Join(ctx.ProjRoot, debFile)
		if err := copyFile(tmpDebLocation, finalTarget); err == nil {
			os.Remove(tmpDebLocation)
		}
	default:
		// Host o VM nativa: portiamo il trofeo a casa (nella radice della repository)
		finalTarget := filepath.Join(ctx.ProjRoot, debFile)
		if err := copyFile(tmpDebLocation, finalTarget); err == nil {
			os.Remove(tmpDebLocation)
			LogBuild("Pacchetto Debian sfornato nella root del progetto: %s", finalTarget)
		} else {
			LogError("Impossibile copiare il pacchetto nella repo: %v", err)
		}
	}

	// Pulizia dello staging scompattato (la cartella di assemblaggio)
	os.RemoveAll(buildDir)
}
