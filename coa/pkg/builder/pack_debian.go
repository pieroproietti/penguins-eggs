package builder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	sysctx "coa/pkg/context"
)

// packDebian costruisce il pacchetto per sistemi basati su Debian (.deb)
// RISPETTA IL PATTO: Sfrutta il RuntimeContext per non usurare i dischi e isolare i build.
func packDebian(pkgVersion string, ctx sysctx.RuntimeContext) {
	pkgName := fmt.Sprintf("oa-tools_%s_amd64", pkgVersion)

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

	// 3. Installazione binari prendendoli direttamente dalla fucina
	binPath := filepath.Join(buildDir, "usr/bin")
	copyFile(filepath.Join(ctx.BaseBuildDir, "oa", "oa"), filepath.Join(binPath, "oa"))
	copyFile(filepath.Join(ctx.BaseBuildDir, "coa", "coa"), filepath.Join(binPath, "coa"))
	os.Chmod(filepath.Join(binPath, "oa"), 0755)
	os.Chmod(filepath.Join(binPath, "coa"), 0755)

	// Creazione del symlink di legacy/compatibilità per 'eggs'
	os.Symlink("coa", filepath.Join(binPath, "eggs"))

	// 4. Gestione della Configurazione YAML e Popolamento brain.d
	confDest := filepath.Join(buildDir, "etc/oa-tools.d")
	brainDest := filepath.Join(confDest, "brain.d")

	// L'indentazione rigorosa con spazi standard per evitare crash del parser YAML
	oaYamlContent := fmt.Sprintf(`---
# oa-tools configuration
# coa is the mind and oa the arm
# Philosophy: https://penguins-eggs.net/blog/eggs-bananas

system:
  dialect: "oa"
  version: "%s"

wardrobe:
  root: "~/.oa-wardrobe"
  repo: "https://github.com/pieroproietti/oa-wardrobe.git"

remaster:
  default_user: "artisan"
  work_dir: "/home/eggs"
`, pkgVersion)

	os.WriteFile(filepath.Join(confDest, "oa-tools.yaml"), []byte(oaYamlContent), 0644)

	// Popolamento brain.d dai sorgenti stabili
	brainSrc := filepath.Join(ctx.CoaDir, "brain.d")
	exec.Command("sh", "-c", fmt.Sprintf("cp -r %s/* %s/", brainSrc, brainDest)).Run()

	// --------------------------------------------------------	-
	// ORIGINE DOCUMENTI (La Regola della Fucina Universale)
	// ---------------------------------------------------------
	docSourceDir := filepath.Join(ctx.BaseBuildDir, "docs")

	// 5. Documentazione (Man pages)
	manDir := filepath.Join(buildDir, "usr/share/man/man1")
	exec.Command("sh", "-c", fmt.Sprintf("cp %s/man/*.1 %s/ && gzip -9 %s/*.1", docSourceDir, manDir, manDir)).Run()

	// 6. Completamenti shell e alias
	bashTarget := filepath.Join(buildDir, "usr/share/bash-completion/completions/coa")
	copyFile(filepath.Join(docSourceDir, "completion/coa.bash"), bashTarget)
	copyFile(filepath.Join(docSourceDir, "completion/coa.zsh"), filepath.Join(buildDir, "usr/share/zsh/vendor-completions/_coa"))
	copyFile(filepath.Join(docSourceDir, "completion/coa.fish"), filepath.Join(buildDir, "usr/share/fish/vendor_completions.d/coa.fish"))

	os.Symlink("coa", filepath.Join(buildDir, "usr/share/bash-completion/completions/eggs"))
	os.Symlink("_coa", filepath.Join(buildDir, "usr/share/zsh/vendor-completions/_eggs"))
	os.Symlink("coa.fish", filepath.Join(buildDir, "usr/share/fish/vendor_completions.d/eggs.fish"))

	// Patch Bash Completion per supportare l'alias 'eggs'
	f, err := os.OpenFile(bashTarget, os.O_APPEND|os.O_WRONLY, 0644)
	if err == nil {
		f.WriteString("\n# eggs alias completion support\ncomplete -o default -F __start_coa eggs\n")
		f.Close()
	}

	// 7. Generazione file control
	controlContent := fmt.Sprintf(`Package: oa-tools
Version: %s
Architecture: amd64
Maintainer: Piero Proietti <piero.proietti@gmail.com>
Depends: squashfs-tools, xorriso, live-boot, live-boot-initramfs-tools, dosfstools, mtools, rsync, git, sudo, grub-pc-bin, grub-efi-amd64-bin
Conflicts: penguins-eggs
Description: coa is the mind and oa the arm
`, pkgVersion)

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

	// 9. Destinazione finale simmetrica guidata dal Contesto (Raddrizzato lo switch)
	switch ctx.EnvType {
	case sysctx.EnvVagrant:
		LogBuild("[Vagrant Mode] Pacchetto Debian protetto in RAM: %s", tmpDebLocation)
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

	// Pulizia dello staging scompattato (manteniamo pulita la RAM)
	// os.RemoveAll(buildRoot) // Nota: assicurati che buildRoot o buildDir sia coerente con la pulizia dello staging
	os.RemoveAll(buildDir)
}
