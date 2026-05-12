package builder

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
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

func buildFedoraPackage(projRoot, oaDir, coaDir, baseVer, relNum string) {
	cleanVer := strings.TrimPrefix(baseVer, "v")
	pkgName := fmt.Sprintf("oa-tools-%s-%s", cleanVer, relNum)
	buildRoot := filepath.Join("/tmp", "rpmbuild_"+pkgName)

	LogBuild("Packing .rpm archive for %s (Evolution Edition)...", pkgName)

	os.RemoveAll(buildRoot)
	dirs := []string{"BUILD", "BUILDROOT", "RPMS", "SOURCES", "SPECS", "SRPMS"}
	for _, d := range dirs {
		os.MkdirAll(filepath.Join(buildRoot, d), 0755)
	}

	specPath := filepath.Join(buildRoot, "SPECS", "oa-tools.spec")

	// ATTENZIONE: Tutti i % sono raddoppiati in %% per convivere con fmt.Sprintf
	specContent := fmt.Sprintf(`%%define debug_package %%{nil}

Name:           oa-tools
Version:        %s
Release:        %s%%{?dist}
Summary:        coa is the mind and oa the arm
License:        GPLv3
URL:            https://penguins-eggs.net/blog/eggs-bananas

# Dipendenze
Requires:       bash-completion
Requires:       squashfs-tools
Requires:       xorriso
Requires:       dosfstools
Requires:       mtools
Requires:       dracut-live
Requires:       gdisk
Requires:       git
Requires:       rsync
Requires:       sudo
Requires:       google-noto-emoji-fonts
Requires:       grub2-pc-modules
Requires:       grub2-efi-x64-modules
Requires:       efibootmgr
Requires:       shim-x64
Conflicts:      penguins-eggs

%%description
oa-tools: la rimasterizzazione universale secondo la filosofia eggs-bananas.
Include il supporto completo per shell completions e branding grafico per il boot.

%%install
rm -rf %%{buildroot}
mkdir -p %%{buildroot}/usr/bin
mkdir -p %%{buildroot}/etc/oa-tools.d/brain.d/assets
mkdir -p %%{buildroot}/etc/oa-tools.d/brain.d/modules
mkdir -p %%{buildroot}/usr/share/man/man1
mkdir -p %%{buildroot}/usr/share/bash-completion/completions
mkdir -p %%{buildroot}/usr/share/zsh/vendor-completions
mkdir -p %%{buildroot}/usr/share/fish/vendor_completions.d

# 1. Installazione Binari
install -m 0755 %s/oa/oa %%{buildroot}/usr/bin/oa
install -m 0755 %s/coa/coa %%{buildroot}/usr/bin/coa
ln -s coa %%{buildroot}/usr/bin/eggs

# 2. Configurazione "Brain", YAML, Moduli e Assets
cp -a %s/coa/brain.d/* %%{buildroot}/etc/oa-tools.d/brain.d/
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

# 3. Man Pages (Risolto escape %%{buildroot})
cp %s/coa/docs/man/*.1 %%{buildroot}/usr/share/man/man1/
gzip -9 %%{buildroot}/usr/share/man/man1/*.1

# 4. Shell Completions (Bash, Zsh, Fish)
install -m 0644 %s/coa/docs/completion/coa.bash %%{buildroot}/usr/share/bash-completion/completions/coa
install -m 0644 %s/coa/docs/completion/coa.zsh %%{buildroot}/usr/share/zsh/vendor-completions/_coa
install -m 0644 %s/coa/docs/completion/coa.fish %%{buildroot}/usr/share/fish/vendor_completions.d/coa.fish

# Patch Bash: registra l'alias 'eggs'
echo "complete -o default -F __start_coa eggs" >> %%{buildroot}/usr/share/bash-completion/completions/coa

# Symlink per gli alias dei completamenti
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
- Added full branding assets (splash screen and boot fonts)
- Added google-noto-emoji-fonts dependency for proper terminal rendering
- Refactored brain.d to use Go templates (modules)
`, cleanVer, relNum, projRoot, projRoot, projRoot, cleanVer, projRoot, projRoot, projRoot, projRoot, cleanVer, relNum)
	// ^ L'ordine qui sopra ora collima perfettamente con i 12 %s nella stringa.

	os.WriteFile(specPath, []byte(specContent), 0644)

	LogBuild("Running rpmbuild...")
	rpmCmd := exec.Command("rpmbuild", "-bb", "--define", fmt.Sprintf("_topdir %s", buildRoot), specPath)
	rpmCmd.Stdout, rpmCmd.Stderr = os.Stdout, os.Stderr

	if err := rpmCmd.Run(); err != nil {
		LogError("RPM build failed: %v", err)
		return
	}

	rpmPattern := filepath.Join(buildRoot, "RPMS", "x86_64", "*.rpm")
	matches, _ := filepath.Glob(rpmPattern)
	if len(matches) > 0 {
		finalPkg := filepath.Join(projRoot, filepath.Base(matches[0]))
		if err := moveFile(matches[0], finalPkg); err == nil {
			LogBuild("✅ RPM Package created with Bash-Completion and Assets: %s", finalPkg)
		} else {
			LogError("Failed to move RPM to root: %v", err)
		}
	}

	os.RemoveAll(buildRoot)
}
