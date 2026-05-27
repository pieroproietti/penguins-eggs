package builder

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	sysctx "coa/pkg/context" // Il nostro scudo contestuale
)

// moveFile gestisce lo spostamento tra partizioni (es. /tmp -> /home)
func moveFile(src, dst string) error {
	err := os.Rename(src, dst)
	if err == nil {
		return nil
	}
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()
	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()
	if _, err := io.Copy(destFile, sourceFile); err != nil {
		return err
	}
	sourceFile.Close()
	return os.Remove(src)
}

// packFedora genera il pacchetto RPM per Fedora e derivate RHEL.
// NUOVA ARCHITETTURA: Tutto nella Home, percorsi agganciati tramite _topdir, zero confusione.
func packFedora(baseVer string, relNum string, ctx sysctx.RuntimeContext) {
	cleanVer := strings.TrimPrefix(baseVer, "v")
	pkgName := fmt.Sprintf("oa-tools-%s-%s", cleanVer, relNum)

	// Il nido di rpmbuild lo teniamo in un angolo isolato della home del progetto per pulizia
	buildRoot := filepath.Join(ctx.ProjRoot, ".rpmbuild_tmp")

	fmt.Printf("[build] Packing .rpm archive for %s (Native Proxmox Edition)...\n", pkgName)

	os.RemoveAll(buildRoot)
	dirs := []string{"BUILD", "BUILDROOT", "RPMS", "SOURCES", "SPECS", "SRPMS"}
	for _, d := range dirs {
		os.MkdirAll(filepath.Join(buildRoot, d), 0755)
	}

	specPath := filepath.Join(buildRoot, "SPECS", "oa-tools.spec")

	// Generiamo lo SPEC. Usiamo %%{_topdir}/../ per risalire alla radice reale dei sorgenti.
	specContent := fmt.Sprintf(`%%define debug_package %%{nil}

Name:           oa-tools
Version:        %s
Release:        %s%%{?dist}
Summary:        coa is the mind and oa the arm
License:        GPLv3
URL:            https://penguins-eggs.net/blog/eggs-bananas

# Dipendenze
Requires:       bash-completion squashfs-tools xorriso dosfstools mtools
Requires:       dracut-live gdisk git rsync sudo google-noto-emoji-fonts
Requires:       grub2-pc-modules grub2-efi-x64-modules efibootmgr shim-x64
Requires:       jq
Conflicts:      penguins-eggs

%%description
oa-tools: la rimasterizzazione universale secondo la filosofia eggs-bananas.

%%install
rm -rf %%{buildroot}
mkdir -p %%{buildroot}/usr/bin
mkdir -p %%{buildroot}/etc/oa-tools.d/brain.d/assets
mkdir -p %%{buildroot}/etc/oa-tools.d/brain.d/modules
mkdir -p %%{buildroot}/usr/share/man/man1
mkdir -p %%{buildroot}/usr/share/bash-completion/completions
mkdir -p %%{buildroot}/usr/share/zsh/vendor-completions
mkdir -p %%{buildroot}/usr/share/fish/vendor_completions.d

# 1. Installazione Binari (Risaliamo rispetto a _topdir per pescare i binari pronti nella home)
install -m 0755 %%{_topdir}/../oa/oa %%{buildroot}/usr/bin/oa
install -m 0755 %%{_topdir}/../coa/coa %%{buildroot}/usr/bin/coa
ln -s coa %%{buildroot}/usr/bin/eggs

# 2. Configurazione "Brain", YAML, Moduli e Assets
cp -a %%{_topdir}/../coa/brain.d/* %%{buildroot}/etc/oa-tools.d/brain.d/
cat <<EOF > %%{buildroot}/etc/oa-tools.d/oa-tools.yaml
---
system:
  dialect: "oa"
  version: "%s"
wardrobe:
  root: "~/.oa-wardrobe"
  repo: "https://github.com/pieroproietti/oa-wardrobe.git"
remaster:
  default_user: "artisan"
  work_dir: "/home/eggs"
EOF

# 3. Man Pages (Generate un istante prima dal Makefile)
cp %%{_topdir}/../coa/docs/man/*.1 %%{buildroot}/usr/share/man/man1/
gzip -9 %%{buildroot}/usr/share/man/man1/*.1

# 4. Shell Completions
install -m 0644 %%{_topdir}/../coa/docs/completion/coa.bash %%{buildroot}/usr/share/bash-completion/completions/coa
install -m 0644 %%{_topdir}/../coa/docs/completion/coa.zsh %%{buildroot}/usr/share/zsh/vendor-completions/_coa
install -m 0644 %%{_topdir}/../coa/docs/completion/coa.fish %%{buildroot}/usr/share/fish/vendor_completions.d/coa.fish

echo "complete -o default -F __start_coa eggs" >> %%{buildroot}/usr/share/bash-completion/completions/coa
ln -s coa %%{buildroot}/usr/share/bash-completion/completions/eggs
ln -s _coa %%{buildroot}/usr/share/zsh/vendor-completions/_eggs
ln -s coa.fish %%{buildroot}/usr/share/fish/vendor_completions.d/eggs.fish

%%files
/usr/bin/oa
/usr/bin/coa
/usr/bin/eggs
%%dir /etc/oa-tools.d
%%dir /etc/oa-tools.d/brain.d
%%dir /etc/oa-tools.d/brain.d/assets
%%dir /etc/oa-tools.d/brain.d/modules
%%config(noreplace) /etc/oa-tools.d/oa-tools.yaml
/etc/oa-tools.d/brain.d/*.yaml
/etc/oa-tools.d/brain.d/*.tmpl
/etc/oa-tools.d/brain.d/assets/*
/etc/oa-tools.d/brain.d/modules/*.tmpl
/usr/share/man/man1/*.1.gz
/usr/share/bash-completion/completions/*
/usr/share/zsh/vendor-completions/*
/usr/share/fish/vendor_completions.d/*

%%changelog
* Sun May 10 2026 Piero Proietti <piero.proietti@gmail.com> - %s-%s
- Native Proxmox build pipeline adaptation
`, cleanVer, relNum, cleanVer, cleanVer, relNum)

	os.WriteFile(specPath, []byte(specContent), 0644)

	fmt.Println("[build] Running rpmbuild...")
	// Lanciamo rpmbuild impostando la directory di lavoro (Dir) nella radice del progetto
	rpmCmd := exec.Command("rpmbuild", "-bb", "--define", fmt.Sprintf("_topdir %s", buildRoot), specPath)
	rpmCmd.Dir = ctx.ProjRoot
	rpmCmd.Stdout, rpmCmd.Stderr = os.Stdout, os.Stderr

	if err := rpmCmd.Run(); err != nil {
		fmt.Printf("[ERROR] RPM build failed: %v\n", err)
		return
	}

	// 3. Spostamento dell'RPM sfornato direttamente nella root del progetto
	rpmPattern := filepath.Join(buildRoot, "RPMS", "x86_64", "*.rpm")
	matches, _ := filepath.Glob(rpmPattern)
	if len(matches) > 0 {
		rpmFile := filepath.Base(matches[0])
		finalPkg := filepath.Join(ctx.ProjRoot, rpmFile)
		if err := moveFile(matches[0], finalPkg); err == nil {
			fmt.Printf("[SUCCESS] Pacchetto RPM creato nella root: %s\n", finalPkg)
		} else {
			fmt.Printf("[ERROR] Failed to move RPM: %v\n", err)
		}
	}

	// Pulizia finale
	os.RemoveAll(buildRoot)
}
