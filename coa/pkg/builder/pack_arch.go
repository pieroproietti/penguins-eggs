package builder

/* nuova versione nativa senza compromessi */

import (
	"fmt"
	"os"
	"path/filepath"

	sysctx "coa/pkg/context"
)

// packArch genera il file PKGBUILD per Arch Linux.
// NUOVA ARCHITETTURA: Percorsi agganciati alla BaseBuildDir, zero dipendenze esterne.
func packArch(baseVer string, relNum string, ctx sysctx.RuntimeContext) {
	// Il PKGBUILD viene generato nella radice del progetto
	outDir := ctx.ProjRoot

	// Passiamo il percorso assoluto della stanza sterile al PKGBUILD
	// in modo che makepkg trovi i binari ovunque decida di creare la sua cartella src/
	buildBinDir := ctx.BaseBuildDir

	pkgbuildContent := fmt.Sprintf(`# Maintainer: Piero Proietti <piero.proietti@gmail.com>
# coa is the mind and oa the arm
pkgname=oa-tools-arch
pkgver=%s
pkgrel=%s
pkgdesc="oa-tools universal Linux remastering volgens la filosofia eggs-bananas"
arch=('x86_64')
license=('GPL3')
depends=(
	'mkinitcpio-archiso'
	'arch-install-scripts'
	'bash-completion'
	'dosfstools'
	'efibootmgr'
	'git'
	'grub'
	'jq'
	'libisoburn'
	'mtools'
	'pv'
	'rsync'
	'squashfs-tools'
	'sudo'
)
conflicts=('penguins-eggs' 'oa-tools')
options=(!debug)

package() {
	# Percorso assoluto dei binari forgiati da 'make'
	local BUILD_BIN_DIR="%s"

	# 1. Installazione binari GIA' COMPILATI
	install -Dm755 "${BUILD_BIN_DIR}/oa" "${pkgdir}/usr/bin/oa"
	install -Dm755 "${BUILD_BIN_DIR}/coa" "${pkgdir}/usr/bin/coa"
	ln -s coa "${pkgdir}/usr/bin/eggs"

	# 2. Configurazione e logica 'Brain' e custom.yaml
	# NOTA: Qui restiamo agganciati ai sorgenti nella ProjRoot
	install -Dm644 "${srcdir}/../etc/oa-tools.d/custom.yaml" "${pkgdir}/etc/oa-tools.d/custom.yaml"
	
	install -d "${pkgdir}/etc/oa-tools.d/brain.d"
	if [ -d "${srcdir}/../coa/brain.d" ]; then
		cp -a "${srcdir}/../coa/brain.d/." "${pkgdir}/etc/oa-tools.d/brain.d/"
	fi

	# 3. Documentazione (Man Pages)
	if [ -d "${srcdir}/../docs/man" ]; then
		for manfile in "${srcdir}/../docs/man/"*.1; do
			if [ -f "$manfile" ]; then
				install -Dm644 "$manfile" "${pkgdir}/usr/share/man/man1/$(basename "$manfile")"
				gzip -9 "${pkgdir}/usr/share/man/man1/$(basename "$manfile")"
			fi
		done
	fi

	# 4. Shell Completions
	install -Dm644 "${srcdir}/../docs/completion/coa.bash" "${pkgdir}/usr/share/bash-completion/completions/coa"
	install -Dm644 "${srcdir}/../docs/completion/coa.zsh" "${pkgdir}/usr/share/zsh/vendor-completions/_coa"
	install -Dm644 "${srcdir}/../docs/completion/coa.fish" "${pkgdir}/usr/share/fish/vendor_completions.d/coa.fish"

	ln -s coa "${pkgdir}/usr/share/bash-completion/completions/eggs"
	ln -s _coa "${pkgdir}/usr/share/zsh/vendor-completions/_eggs"
	ln -s coa.fish "${pkgdir}/usr/share/fish/vendor_completions.d/eggs.fish"

	echo "complete -o default -F __start_coa eggs" >> "${pkgdir}/usr/share/bash-completion/completions/coa"
}
`, baseVer, relNum, buildBinDir)

	pkgbuildPath := filepath.Join(outDir, "PKGBUILD")
	err := os.WriteFile(pkgbuildPath, []byte(pkgbuildContent), 0644)
	if err != nil {
		fmt.Printf("[ERROR] Failed to write PKGBUILD: %v\n", err)
		return
	}

	fmt.Printf("[SUCCESS] [Native Mode] PKGBUILD (Arch) generato nella root: %s\n", pkgbuildPath)
}
