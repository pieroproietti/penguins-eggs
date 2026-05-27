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

	// 1. Il tavolo da lavoro è la fucina sicura definita dal Contesto
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

	// 3. Installazione binari prendendoli direttamente dal Progetto (dove 'make' li ha appena forgiati)
	binPath := filepath.Join(buildDir, "usr/bin")

	if err := copyFile(filepath.Join(ctx.ProjRoot, "oa", "oa"), filepath.Join(binPath, "oa")); err != nil {
		LogError("⚠️ ERRORE: Impossibile copiare il binario 'oa': %v", err)
	}

	if err := copyFile(filepath.Join(ctx.ProjRoot, "coa", "coa"), filepath.Join(binPath, "coa")); err != nil {
		LogError("⚠️ ERRORE: Impossibile copiare il binario 'coa': %v", err)
	}

	os.Chmod(filepath.Join(binPath, "oa"), 0755)
	os.Chmod(filepath.Join(binPath, "coa"), 0755)

	// Creazione del symlink di legacy/compatibilità per 'eggs'
	os.Symlink("coa", filepath.Join(binPath, "eggs"))

	// 4. Gestione della Configurazione YAML e Popolamento brain.d
	confDest := filepath.Join(buildDir, "etc/oa-tools.d")
	brainDest := filepath.Join(confDest, "brain.d")

	// Copia configurazione custom.yaml dal sorgente root alla buildDir
	defaultName := "custom.yaml"
	defaultSrc := filepath.Join(ctx.ProjRoot, "etc", "oa-tools.d", defaultName)
	defaultDest := filepath.Join(confDest, defaultName)

	// Lettura e scrittura nativa
	input, err := os.ReadFile(defaultSrc)
	if err == nil {
		os.WriteFile(defaultDest, input, 0644)
	} else {
		fmt.Printf("Attenzione: impossibile leggere %s: %v\n", defaultSrc, err)
		os.Exit(1)
	}

	// Popolamento brain.d dai sorgenti
	brainSrc := filepath.Join(ctx.CoaDir, "brain.d")

	// Aggiungiamo "/." alla fine del percorso sorgente per prendere anche i file nascosti.
	srcPath := brainSrc + string(filepath.Separator) + "."

	// Invochiamo 'cp' direttamente, usando '-a' (archive) invece di '-r'.
	cmd := exec.Command("cp", "-a", srcPath, brainDest)

	// Catturiamo e gestiamo l'errore per evitare fallimenti silenziosi
	if err := cmd.Run(); err != nil {
		fmt.Printf("Errore critico durante il popolamento di %s: %v\n", brainDest, err)
		os.Exit(1)
	}

	// ---------------------------------------------------------
	// ORIGINE DOCUMENTI (Prendiamo dalla Root del progetto, non dalla fucina!)
	// ---------------------------------------------------------
	docSourceDir := filepath.Join(ctx.ProjRoot, "docs")

	// 5. Documentazione (Man pages) - con soppressione errori in caso manchino file
	manDir := filepath.Join(buildDir, "usr/share/man/man1")
	exec.Command("sh", "-c", fmt.Sprintf("cp %s/man/*.1 %s/ 2>/dev/null && gzip -9 %s/*.1 2>/dev/null", docSourceDir, manDir, manDir)).Run()

	// 6. Completamenti shell e alias (Generati freschi da Cobra via binario appena compilato)
	bashCompDir := filepath.Join(buildDir, "usr/share/bash-completion/completions")
	zshCompDir := filepath.Join(buildDir, "usr/share/zsh/vendor-completions")
	fishCompDir := filepath.Join(buildDir, "usr/share/fish/vendor_completions.d")

	// BASH: Esegue il binario 'coa' appena forgiato per generare i completamenti aggiornati
	bashOut, _ := exec.Command(filepath.Join(binPath, "coa"), "completion", "bash").Output()
	os.WriteFile(filepath.Join(bashCompDir, "coa"), bashOut, 0644)

	// Rigenera il completamento per l'alias "eggs" sostituendo "coa" con "eggs" nell'output
	eggsBashOut := strings.ReplaceAll(string(bashOut), " coa", " eggs")
	eggsBashOut = strings.ReplaceAll(eggsBashOut, "__start_coa", "__start_eggs")
	os.WriteFile(filepath.Join(bashCompDir, "eggs"), []byte(eggsBashOut), 0644)

	// ZSH
	zshOut, _ := exec.Command(filepath.Join(binPath, "coa"), "completion", "zsh").Output()
	os.WriteFile(filepath.Join(zshCompDir, "_coa"), zshOut, 0644)
	os.Symlink("_coa", filepath.Join(zshCompDir, "_eggs"))

	// FISH
	fishOut, _ := exec.Command(filepath.Join(binPath, "coa"), "completion", "fish").Output()
	os.WriteFile(filepath.Join(fishCompDir, "coa.fish"), fishOut, 0644)
	os.Symlink("coa.fish", filepath.Join(fishCompDir, "eggs.fish"))

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

	// 8. Impacchettamento con dpkg-deb direttamente nella fucina
	debFile := pkgName + ".deb"
	tmpDebLocation := filepath.Join(ctx.BaseBuildDir, debFile)

	dpkgCmd := exec.Command("dpkg-deb", "--build", buildDir, tmpDebLocation)
	dpkgCmd.Stdout, dpkgCmd.Stderr = os.Stdout, os.Stderr
	if err := dpkgCmd.Run(); err != nil {
		LogError("Failed to build Debian package: %v", err)
		return
	}

	// 9. Destinazione finale simmetrica guidata dal Contesto (Addio Vagrant!)
	switch ctx.EnvType {
	case sysctx.EnvCI:
		LogBuild("[CI Mode] Pacchetto Debian rilasciato nel workspace: %s", tmpDebLocation)
	default:
		// Host o VM nativa: portiamo il trofeo a casa (nella radice della repository)
		finalTarget := filepath.Join(ctx.ProjRoot, debFile)

		// Usiamo copyFile invece di os.Rename per evitare errori "Invalid cross-device link"
		if err := copyFile(tmpDebLocation, finalTarget); err == nil {
			os.Remove(tmpDebLocation) // Pulizia del temp originario
			LogBuild("Pacchetto Debian sfornato nella root del progetto: %s", finalTarget)
		} else {
			LogError("Impossibile copiare il pacchetto nella repo: %v", err)
		}
	}

	// Pulizia dello staging scompattato (manteniamo pulita la RAM o il disco locale)
	os.RemoveAll(buildDir)
}
