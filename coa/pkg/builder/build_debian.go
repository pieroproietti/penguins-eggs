package builder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func buildDebianPackage(projRoot, oaDir, coaDir, pkgVersion string) {
	pkgName := fmt.Sprintf("oa-tools_%s_amd64", pkgVersion)

	// 1. Definiamo la baseBuildDir con fallback automatico (Simmetria con Arch)
	baseBuildDir := os.Getenv("BUILD_DIR")
	if baseBuildDir == "" {
		baseBuildDir = "/tmp/oa-build"
	}

	// Cartella di staging per la struttura dei file del pacchetto
	buildDir := filepath.Join(baseBuildDir, pkgName)

	// Pulizia preventiva del tavolo da lavoro temporaneo
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

	// 3. Installazione binari prendendoli direttamente dallo schema specchio in RAM
	binPath := filepath.Join(buildDir, "usr/bin")
	copyFile(filepath.Join(baseBuildDir, "oa", "oa"), filepath.Join(binPath, "oa"))
	copyFile(filepath.Join(baseBuildDir, "coa", "coa"), filepath.Join(binPath, "coa"))
	os.Chmod(filepath.Join(binPath, "oa"), 0755)
	os.Chmod(filepath.Join(binPath, "coa"), 0755)
	os.Symlink("coa", filepath.Join(binPath, "eggs"))

	// 4. Gestione della Configurazione YAML e Popolamento brain.d
	confDest := filepath.Join(buildDir, "etc/oa-tools.d")
	brainDest := filepath.Join(confDest, "brain.d")

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
	brainSrc := filepath.Join(projRoot, "coa", "brain.d")
	exec.Command("sh", "-c", fmt.Sprintf("cp -r %s/* %s/", brainSrc, brainDest)).Run()

	// 5. Documentazione (Man pages)
	manDir := filepath.Join(buildDir, "usr/share/man/man1")
	exec.Command("sh", "-c", fmt.Sprintf("cp %s/docs/man/*.1 %s/ && gzip -9 %s/*.1", coaDir, manDir, manDir)).Run()

	// 6. Completamenti shell e alias
	bashTarget := filepath.Join(buildDir, "usr/share/bash-completion/completions/coa")
	copyFile(filepath.Join(coaDir, "docs/completion/coa.bash"), bashTarget)
	copyFile(filepath.Join(coaDir, "docs/completion/coa.zsh"), filepath.Join(buildDir, "usr/share/zsh/vendor-completions/_coa"))
	copyFile(filepath.Join(coaDir, "docs/completion/coa.fish"), filepath.Join(buildDir, "usr/share/fish/vendor_completions.d/coa.fish"))

	os.Symlink("coa", filepath.Join(buildDir, "usr/share/bash-completion/completions/eggs"))
	os.Symlink("_coa", filepath.Join(buildDir, "usr/share/zsh/vendor-completions/_eggs"))
	os.Symlink("coa.fish", filepath.Join(buildDir, "usr/share/fish/vendor_completions.d/eggs.fish"))

	// Patch Bash Completion
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

	// 8. Impacchettamento con dpkg-deb direttamente nella cartella temporanea scelta
	fmt.Printf("%s[build]%s Packing .deb archive (%s)...\n", ColorBlue, ColorReset, pkgVersion)
	debFile := pkgName + ".deb"
	tmpDebLocation := filepath.Join(baseBuildDir, debFile)

	dpkgCmd := exec.Command("dpkg-deb", "--build", buildDir, tmpDebLocation)
	dpkgCmd.Stdout, dpkgCmd.Stderr = os.Stdout, os.Stderr
	if err := dpkgCmd.Run(); err != nil {
		fmt.Printf("%s[ERROR]%s Failed to build package: %v\n", ColorRed, ColorReset, err)
		return
	}

	// 9. Destinazione finale simmetrica basata sulla presenza dell'ambiente Vagrant
	if os.Getenv("BUILD_DIR") != "" {
		// Siamo in Vagrant: lasciamo il pacchetto al sicuro in /tmp/oa-build/ evitando il mount 9p
		fmt.Printf("%s[SUCCESS]%s [Vagrant Mode] Pacchetto Debian protetto in: %s\n", ColorGreen, ColorReset, tmpDebLocation)
	} else {
		// Siamo sull'host locale: copiamo il file nella root del progetto e puliamo il temporaneo
		finalTarget := filepath.Join(projRoot, debFile)
		data, err := os.ReadFile(tmpDebLocation)
		if err == nil {
			if err := os.WriteFile(finalTarget, data, 0644); err == nil {
				os.Remove(tmpDebLocation)
				fmt.Printf("%s[SUCCESS]%s Pacchetto creato nella root del progetto: %s\n", ColorGreen, ColorReset, finalTarget)
				os.RemoveAll(buildDir)
				return
			}
		}
		// Fallback di sicurezza se la copia fallisce per altri motivi
		fmt.Printf("%s[SUCCESS]%s Pacchetto Debian disponibile in: %s\n", ColorGreen, ColorReset, tmpDebLocation)
	}

	// Pulizia dello staging scompattato
	os.RemoveAll(buildDir)
}
