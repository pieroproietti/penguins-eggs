package builder

/* sesta bandiera: versione nativa specifica per Alpine Linux */

import (
	"fmt"
	"os"
	"path/filepath"

	sysctx "coa/pkg/context"
)

// packAlpine genera il file APKBUILD per Alpine Linux.
// NUOVA ARCHITETTURA: Percorsi agganciati risalendo da srcdir, zero dipendenze esterne.
func packAlpine(baseVer string, relNum string, ctx sysctx.RuntimeContext) {
	// L'APKBUILD viene sputato sempre e comunque nella radice del progetto
	outDir := ctx.ProjRoot

	// L'APKBUILD NATIVO: Sulla falsariga di Arch, usiamo "${srcdir}/../"
	pkgbuildContent := fmt.Sprintf(`# Maintainer: Piero Proietti <piero.proietti@gmail.com>
# coa is the mind and oa the arm
pkgname=oa-tools-alpine
pkgver=%s
pkgrel=%s
pkgdesc="oa-tools universal Linux remastering volgens la filosofia eggs-bananas"
url="https://penguins-eggs.net/blog/eggs-bananas"
arch="x86_64"
license="GPL-3.0-only"
# Dipendenze tipiche di Alpine per la rimasterizzazione
depends="bash-completion dosfstools efibootmgr git grub jq mtools pv rsync squashfs-tools sudo xorriso"
makedepends=""
source=""

builddir="$srcdir"

package() {
	# Nota: abuild lavora in 'src/'. Usiamo "${srcdir}/../" per ritornare
	# stabilmente nella radice dei sorgenti reali appena compilati localmente.

	# 1. Installazione binari GIA' COMPILATI localmente da 'make'
	install -Dm755 "${srcdir}/../oa/oa" "${pkgdir}/usr/bin/oa"
	install -Dm755 "${srcdir}/../coa/coa" "${pkgdir}/usr/bin/coa"
	ln -s coa "${pkgdir}/usr/bin/eggs"

	# 2. Configurazione e logica 'Brain' e custom.yaml
	install -Dm644 "${srcdir}/../etc/oa-tools.d/custom.yaml" "${pkgdir}/etc/oa-tools.d/custom.yaml"

	install -d "${pkgdir}/etc/oa-tools.d/brain.d"
	if [ -d "${srcdir}/../coa/brain.d" ]; then
		# Usiamo '/.' con cp -a per includere file nascosti e preservare i permessi
		cp -a "${srcdir}/../coa/brain.d/." "${pkgdir}/etc/oa-tools.d/brain.d/"
	fi

	# 3. Documentazione (Man Pages) allineata alla radice del progetto
	if [ -d "${srcdir}/../docs/man" ]; then
		for manfile in "${srcdir}/../docs/man/"*.1; do
			if [ -f "$manfile" ]; then
				install -Dm644 "$manfile" "${pkgdir}/usr/share/man/man1/$(basename "$manfile")"
				gzip -9 "${pkgdir}/usr/share/man/man1/$(basename "$manfile")"
			fi
		done
	fi

	# 4. Shell Completions riallineate a docs/completion/
	install -Dm644 "${srcdir}/../docs/completion/coa.bash" "${pkgdir}/usr/share/bash-completion/completions/coa"
	install -Dm644 "${srcdir}/../docs/completion/coa.zsh" "${pkgdir}/usr/share/zsh/site-functions/_coa"
	install -Dm644 "${srcdir}/../docs/completion/coa.fish" "${pkgdir}/usr/share/fish/vendor_completions.d/coa.fish"

	ln -s coa "${pkgdir}/usr/share/bash-completion/completions/eggs"
	ln -s _coa "${pkgdir}/usr/share/zsh/site-functions/_eggs"
	ln -s coa.fish "${pkgdir}/usr/share/fish/vendor_completions.d/eggs.fish"

	echo "complete -o default -F __start_coa eggs" >> "${pkgdir}/usr/share/bash-completion/completions/coa"
}
`, baseVer, relNum)

	pkgbuildPath := filepath.Join(outDir, "APKBUILD")
	err := os.WriteFile(pkgbuildPath, []byte(pkgbuildContent), 0644)
	if err != nil {
		fmt.Printf("[ERROR] Failed to write APKBUILD: %v\n", err)
		return
	}

	fmt.Printf("[SUCCESS] [Native Mode] APKBUILD (Alpine) generato nella root: %s\n", pkgbuildPath)
}
