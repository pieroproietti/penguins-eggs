package builder

/* quinta bandiera: versione nativa specifica per openSUSE Slowroll */

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	sysctx "coa/pkg/context"
)

// packOpenSUSE genera il file SPEC e lancia rpmbuild per openSUSE.
// FILOSOFIA NATIVA: Tutto nella Home, percorsi relativi agganciati via _topdir.
func packOpenSUSE(baseVer string, relNum string, ctx sysctx.RuntimeContext) {
	cleanVer := strings.TrimPrefix(baseVer, "v")
	pkgName := fmt.Sprintf("oa-tools-%s-%s", cleanVer, relNum)

	// Il nido di rpmbuild isolato nella home del progetto
	buildRoot := filepath.Join(ctx.ProjRoot, ".rpmbuild_opensuse_tmp")

	fmt.Printf("[build] Packing .rpm archive for %s (openSUSE Slowroll Edition)... 🦎\n", pkgName)

	os.RemoveAll(buildRoot)
	dirs := []string{"BUILD", "BUILDROOT", "RPMS", "SOURCES", "SPECS", "SRPMS"}
	for _, d := range dirs {
		os.MkdirAll(filepath.Join(buildRoot, d), 0755)
	}

	specPath := filepath.Join(buildRoot, "SPECS", "oa-tools-opensuse.spec")

	// Generiamo lo SPEC. Su openSUSE le dipendenze cambiano nome rispetto a Fedora.
	specContent := fmt.Sprintf(`%%define debug_package %%{nil}

Name:           oa-tools
Version:        %s
Release:        %s
Summary:        coa is the mind and oa the arm (openSUSE Edition)
License:        GPLv3
URL:            https://penguins-eggs.net/blog/eggs-bananas

# Dipendenze verificate per il mondo SUSE/Zypper
Requires:       bash-completion squashfs xorriso dosfstools mtools jq
Requires:       dracut grub2 rsync sudo git pv
Conflicts:      penguins-eggs

%%description
oa-tools: la rimasterizzazione universale secondo la filosofia eggs-bananas adattata per openSUSE.

%%install
rm -rf %%{buildroot}
mkdir -p %%{buildroot}/usr/bin
mkdir -p %%{buildroot}/etc/oa-tools.d/brain.d
mkdir -p %%{buildroot}/usr/share/man/man1
mkdir -p %%{buildroot}/usr/share/bash-completion/completions
mkdir -p %%{buildroot}/usr/share/zsh/vendor-completions
mkdir -p %%{buildroot}/usr/share/fish/vendor_completions.d

# 1. Installazione Binari via _topdir
install -m 0755 %%{_topdir}/../oa/oa %%{buildroot}/usr/bin/oa
install -m 0755 %%{_topdir}/../coa/coa %%{buildroot}/usr/bin/coa
ln -s coa %%{buildroot}/usr/bin/eggs

# 2. Configurazione Brain & custom.yaml dinamico
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
* Wed May 27 2026 Piero Proietti <piero.proietti@gmail.com> - %s-%s
- openSUSE Slowroll native integration
`, cleanVer, relNum, cleanVer, relNum)

	os.WriteFile(specPath, []byte(specContent), 0644)

	fmt.Println("[build] Running rpmbuild on openSUSE...")
	rpmCmd := exec.Command("rpmbuild", "-bb", "--define", fmt.Sprintf("_topdir %s", buildRoot), specPath)
	rpmCmd.Dir = ctx.ProjRoot
	rpmCmd.Stdout, rpmCmd.Stderr = os.Stdout, os.Stderr

	if err := rpmCmd.Run(); err != nil {
		fmt.Printf("[ERROR] openSUSE RPM build failed: %v\n", err)
		return
	}

	// Recupero del pacchetto (Go Glob non supporta **, indichiamo esplicitamente x86_64)
	rpmPattern := filepath.Join(buildRoot, "RPMS", "x86_64", "*.rpm")
	matches, _ := filepath.Glob(rpmPattern)
	if len(matches) > 0 {
		rpmFile := filepath.Base(matches[0])
		finalPkg := filepath.Join(ctx.ProjRoot, rpmFile)

		// Usiamo il robusto copyFile condiviso
		if err := copyFile(matches[0], finalPkg); err == nil {
			os.Remove(matches[0])
			fmt.Printf("[SUCCESS] Pacchetto RPM per openSUSE creato nella root: %s\n", finalPkg)
		} else {
			fmt.Printf("[ERROR] Failed to move openSUSE RPM: %v\n", err)
		}
	}

	os.RemoveAll(buildRoot)
}
