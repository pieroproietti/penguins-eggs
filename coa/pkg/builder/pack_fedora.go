package builder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	sysctx "coa/pkg/context" // Il nostro scudo contestuale
)

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
mkdir -p %%{buildroot}/etc/oa-tools.d/brain.d
mkdir -p %%{buildroot}/usr/share/man/man1
mkdir -p %%{buildroot}/usr/share/bash-completion/completions
mkdir -p %%{buildroot}/usr/share/zsh/vendor-completions
mkdir -p %%{buildroot}/usr/share/fish/vendor_completions.d

# 1. Installazione Binari (Risaliamo rispetto a _topdir per pescare i binari pronti nella home)
install -m 0755 %%{_topdir}/../oa/oa %%{buildroot}/usr/bin/oa
install -m 0755 %%{_topdir}/../coa/coa %%{buildroot}/usr/bin/coa
ln -s coa %%{buildroot}/usr/bin/eggs

# 2. Configurazione "Brain" e custom.yaml dinamico
cp -a %%{_topdir}/../coa/brain.d/. %%{buildroot}/etc/oa-tools.d/brain.d/
install -m 0644 %%{_topdir}/../etc/oa-tools.d/custom.yaml %%{buildroot}/etc/oa-tools.d/custom.yaml

# 3. Man Pages (Allineate alla nuova architettura in root/docs)
cp %%{_topdir}/../docs/man/*.1 %%{buildroot}/usr/share/man/man1/
gzip -9 %%{buildroot}/usr/share/man/man1/*.1

# 4. Shell Completions (Allineate alla nuova architettura in root/docs)
install -m 0644 %%{_topdir}/../docs/completion/coa.bash %%{buildroot}/usr/share/bash-completion/completions/coa
install -m 0644 %%{_topdir}/../docs/completion/coa.zsh %%{buildroot}/usr/share/zsh/vendor-completions/_coa
install -m 0644 %%{_topdir}/../docs/completion/coa.fish %%{buildroot}/usr/share/fish/vendor_completions.d/coa.fish

echo "complete -o default -F __start_coa eggs" >> %%{buildroot}/usr/share/bash-completion/completions/coa
ln -s coa %%{buildroot}/usr/share/bash-completion/completions/eggs
ln -s _coa %%{buildroot}/usr/share/zsh/vendor-completions/_eggs
ln -s coa.fish %%{buildroot}/usr/share/fish/vendor_completions.d/eggs.fish

%%files
/usr/bin/oa
/usr/bin/coa
/usr/bin/eggs
%%dir /etc/oa-tools.d
/etc/oa-tools.d/brain.d
%%config(noreplace) /etc/oa-tools.d/custom.yaml
/usr/share/man/man1/*.1.gz
/usr/share/bash-completion/completions/*
/usr/share/zsh/vendor-completions/*
/usr/share/fish/vendor_completions.d/*

%%changelog
* Sun May 10 2026 Piero Proietti <piero.proietti@gmail.com> - %s-%s
- Native Proxmox build pipeline adaptation
`, cleanVer, relNum, cleanVer, relNum)

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

		// Usiamo il copyFile condiviso che è molto più sicuro, poi rimuoviamo l'originale
		if err := copyFile(matches[0], finalPkg); err == nil {
			os.Remove(matches[0])
			fmt.Printf("[SUCCESS] Pacchetto RPM creato nella root: %s\n", finalPkg)
		} else {
			fmt.Printf("[ERROR] Failed to move RPM: %v\n", err)
		}
	}

	// Pulizia finale
	os.RemoveAll(buildRoot)
}
