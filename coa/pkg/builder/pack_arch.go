package builder

/* nuova versione nativa senza compromessi */

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	sysctx "coa/pkg/context"
)

// packArch genera il file PKGBUILD per Arch Linux.
// NUOVA ARCHITETTURA: Percorsi agganciati risalendo da srcdir, zero dipendenze esterne.
func packArch(baseVer string, relNum string, ctx sysctx.RuntimeContext) {
	// Il PKGBUILD viene sputato sempre e comunque nella radice del progetto
	outDir := ctx.ProjRoot

	// PULIZIA PER ARCH LINUX (pkgver conformi alle direttive Pacman):
	cleanVer := strings.TrimPrefix(baseVer, "v")
	cleanVer = strings.ReplaceAll(cleanVer, "-", ".")
	cleanVer = strings.ReplaceAll(cleanVer, "_", ".")

	// IL PKGBUILD NATIVO: Risaliamo di un livello rispetto a srcdir (../)
	// per pescare l'albero dei sorgenti reali nella Home dell'utente.
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
	'efibootmgr'
	'libisoburn'
	'squashfs-tools'
	'mtools'
	'dosfstools'
	'arch-install-scripts'
	'grub'
	'rsync'
	'sudo'
	'pv'
	'git'
	'bash-completion'
)
conflicts=('penguins-eggs' 'oa-tools')
backup=('etc/oa-tools.d/oa-tools.yaml')
options=(!debug)

package() {
	# Nota: makepkg ci infila dentro 'src/'. Usiamo "${srcdir}/../" per ritornare
	# stabilmente nella radice dei sorgenti ed evitare disallineamenti.

	# 1. Installazione binari GIA' COMPILATI localmente da 'make'
	install -Dm755 "${srcdir}/../oa/oa" "${pkgdir}/usr/bin/oa"
	install -Dm755 "${srcdir}/../coa/coa" "${pkgdir}/usr/bin/coa"
	ln -s coa "${pkgdir}/usr/bin/eggs"

	# 2. Configurazione e logica 'Brain'
	install -d "${pkgdir}/etc/oa-tools.d/brain.d"
	if [ -d "${srcdir}/../coa/brain.d" ]; then
		cp -r "${srcdir}/../coa/brain.d/"* "${pkgdir}/etc/oa-tools.d/brain.d/"
	fi

	cat <<EOF > "${pkgdir}/etc/oa-tools.d/oa-tools.yaml"
---
# oa-tools configuration
# Philosophy: https://penguins-eggs.net/blog/eggs-bananas

system:
  dialect: "oa"
  version: "${pkgver}"

wardrobe:
  root: "~/.oa-wardrobe"
  repo: "https://github.com/pieroproietti/oa-wardrobe.git"

remaster:
  default_user: "artisan"
  work_dir: "/home/eggs"
EOF

	# 3. Documentazione (Man Pages) riallineata alla nuova struttura del Makefile
	if [ -d "${srcdir}/../coa/docs/man" ]; then
		install -d "${pkgdir}/usr/share/man/man1"
		for manfile in "${srcdir}/../coa/docs/man/"*.1; do
			if [ -f "$manfile" ]; then
				cp "$manfile" "${pkgdir}/usr/share/man/man1/"
				chmod 644 "${pkgdir}/usr/share/man/man1/"$(basename "$manfile")
			fi
		done
	fi

	# 4. Shell Completions riallineate a coa/docs/completion/
	install -Dm644 "${srcdir}/../coa/docs/completion/coa.bash" "${pkgdir}/usr/share/bash-completion/completions/coa"
	install -Dm644 "${srcdir}/../coa/docs/completion/coa.zsh" "${pkgdir}/usr/share/zsh/vendor-completions/_coa"
	install -Dm644 "${srcdir}/../coa/docs/completion/coa.fish" "${pkgdir}/usr/share/fish/vendor_completions.d/coa.fish"

	ln -s coa "${pkgdir}/usr/share/bash-completion/completions/eggs"
	ln -s _coa "${pkgdir}/usr/share/zsh/vendor-completions/_eggs"
	ln -s coa.fish "${pkgdir}/usr/share/fish/vendor_completions.d/eggs.fish"

	echo "complete -o default -F __start_coa eggs" >> "${pkgdir}/usr/share/bash-completion/completions/coa"
}
`, cleanVer, relNum)

	pkgbuildPath := filepath.Join(outDir, "PKGBUILD")
	err := os.WriteFile(pkgbuildPath, []byte(pkgbuildContent), 0644)
	if err != nil {
		fmt.Printf("[ERROR] Failed to write PKGBUILD: %v\n", err)
		return
	}

	fmt.Printf("[SUCCESS] [Native Mode] PKGBUILD (Arch) generato nella root: %s\n", pkgbuildPath)
}
