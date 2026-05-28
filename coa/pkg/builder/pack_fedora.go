package builder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	sysctx "coa/pkg/context"
)

// packFedora genera il pacchetto RPM per Fedora e derivate RHEL.
func packFedora(baseVer string, relNum string, ctx sysctx.RuntimeContext) {
	cleanVer := strings.TrimPrefix(baseVer, "v")
	pkgName := fmt.Sprintf("oa-tools-%s-%s", cleanVer, relNum)

	// La buildRoot rimane nella root del progetto per ispezionabilità
	buildRoot := filepath.Join(ctx.ProjRoot, ".rpmbuild_tmp")

	// Passiamo il percorso assoluto della stanza sterile allo SPEC
	buildBinDir := ctx.BaseBuildDir

	fmt.Printf("[build] Packing .rpm archive for %s (Native Proxmox Edition)...\n", pkgName)

	os.RemoveAll(buildRoot)
	dirs := []string{"BUILD", "BUILDROOT", "RPMS", "SOURCES", "SPECS", "SRPMS"}
	for _, d := range dirs {
		os.MkdirAll(filepath.Join(buildRoot, d), 0755)
	}

	specPath := filepath.Join(buildRoot, "SPECS", "oa-tools.spec")

	specContent := fmt.Sprintf(`%%define debug_package %%{nil}
%%define build_bin_dir %s

Name:           oa-tools
Version:        %s
Release:        %s%%{?dist}
Summary:        coa is the mind and oa the arm
License:        GPLv3
URL:            https://penguins-eggs.net/blog/eggs-bananas

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

# 1. Installazione Binari dalla Stanza Sterile (BUILD_BIN_DIR)
install -m 0755 %%{build_bin_dir}/oa %%{buildroot}/usr/bin/oa
install -m 0755 %%{build_bin_dir}/coa %%{buildroot}/usr/bin/coa
ln -s coa %%{buildroot}/usr/bin/eggs

# 2. Configurazione (Sorgenti)
cp -a %%{_topdir}/../coa/brain.d/. %%{buildroot}/etc/oa-tools.d/brain.d/
install -m 0644 %%{_topdir}/../etc/oa-tools.d/custom.yaml %%{buildroot}/etc/oa-tools.d/custom.yaml

# 3. Documentazione e Completamenti (Sorgenti)
cp %%{_topdir}/../docs/man/*.1 %%{buildroot}/usr/share/man/man1/
gzip -9 %%{buildroot}/usr/share/man/man1/*.1

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
`, buildBinDir, cleanVer, relNum)

	os.WriteFile(specPath, []byte(specContent), 0644)

	// Build
	rpmCmd := exec.Command("rpmbuild", "-bb", "--define", fmt.Sprintf("_topdir %s", buildRoot), specPath)
	rpmCmd.Stdout, rpmCmd.Stderr = os.Stdout, os.Stderr
	rpmCmd.Run()

	// Spostamento RPM
	rpmPattern := filepath.Join(buildRoot, "RPMS", "*", "*.rpm")
	matches, _ := filepath.Glob(rpmPattern)
	if len(matches) > 0 {
		finalPkg := filepath.Join(ctx.ProjRoot, filepath.Base(matches[0]))
		copyFile(matches[0], finalPkg)
		os.Remove(matches[0])
	}
	os.RemoveAll(buildRoot)
}
