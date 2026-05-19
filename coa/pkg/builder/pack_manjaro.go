package builder

import (
	"fmt"
	"os"
	"path/filepath"

	sysctx "coa/pkg/context"
)

// packManjaro genera il file PKGBUILD specifico per Manjaro Linux.
func packManjaro(baseVer string, relNum string, ctx sysctx.RuntimeContext) {
	var outDir string

	if ctx.EnvType == sysctx.EnvVagrant {
		outDir = ctx.BaseBuildDir
	} else {
		outDir = ctx.ProjRoot
	}

	// IL PKGBUILD SEMPLICE: L'orchestratore ha già fatto tutto.
	pkgbuildContent := fmt.Sprintf(`# Maintainer: Piero Proietti <piero.proietti@gmail.com>
# coa is the mind and oa the arm
pkgname=oa-tools-manjaro
pkgver=%s
pkgrel=%s
_srcdir="%s"
_coadir="%s"
_build_dir="%s"
pkgdesc="oa-tools universal Linux remastering (Manjaro edition)"
arch=('x86_64')
license=('GPL3')
# Optimized Manjaro dependencies for oa-tools
depends=(
    'manjaro-tools-iso'      # Hook miso per initramfs (fondamentale su Manjaro)
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
    # 1. Installazione binari GIA' COMPILATI dall'orchestratore in RAM
    install -Dm755 "${_build_dir}/oa/oa" "${pkgdir}/usr/bin/oa"
    install -Dm755 "${_build_dir}/coa/coa" "${pkgdir}/usr/bin/coa"
    ln -s coa "${pkgdir}/usr/bin/eggs"

    # 2. Configurazione e logica agnostica
    install -d "${pkgdir}/etc/oa-tools.d/brain.d"
    if [ -d "${_coadir}/brain.d" ]; then
        cp -r "${_coadir}/brain.d/"* "${pkgdir}/etc/oa-tools.d/brain.d/"
    fi

    cat <<EOF > "${pkgdir}/etc/oa-tools.d/oa-tools.yaml"
---
# oa-tools configuration (Manjaro)
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

    if [ -d "${_srcdir}/conf" ]; then
        cp -r "${_srcdir}/conf/"* "${pkgdir}/etc/oa-tools.d/"
    fi

    # 3. Documentazione GIA' GENERATA in RAM dall'orchestratore
    if [ -d "${_build_dir}/docs/man" ]; then
        install -d "${pkgdir}/usr/share/man/man1"
        for manfile in "${_build_dir}/docs/man/"*.1; do
            if [ -f "$manfile" ]; then
                cp "$manfile" "${pkgdir}/usr/share/man/man1/"
                chmod 644 "${pkgdir}/usr/share/man/man1/"$(basename "$manfile")
            fi
        done
    fi

    install -Dm644 "${_build_dir}/docs/completion/coa.bash" "${pkgdir}/usr/share/bash-completion/completions/coa"
    install -Dm644 "${_build_dir}/docs/completion/coa.zsh" "${pkgdir}/usr/share/zsh/vendor-completions/_coa"
    install -Dm644 "${_build_dir}/docs/completion/coa.fish" "${pkgdir}/usr/share/fish/vendor_completions.d/coa.fish"

    ln -s coa "${pkgdir}/usr/share/bash-completion/completions/eggs"
    ln -s _coa "${pkgdir}/usr/share/zsh/vendor-completions/_eggs"
    ln -s coa.fish "${pkgdir}/usr/share/fish/vendor_completions.d/eggs.fish"

    echo "complete -o default -F __start_coa eggs" >> "${pkgdir}/usr/share/bash-completion/completions/coa"
}
`, baseVer, relNum, ctx.ProjRoot, ctx.CoaDir, ctx.BaseBuildDir)

	// Scrittura del file PKGBUILD direttamente nella cartella di output
	pkgbuildPath := filepath.Join(outDir, "PKGBUILD")
	err := os.WriteFile(pkgbuildPath, []byte(pkgbuildContent), 0644)
	if err != nil {
		fmt.Printf("[ERROR] Failed to write PKGBUILD in %s: %v\n", outDir, err)
		return
	}

	if ctx.EnvType == sysctx.EnvVagrant {
		fmt.Printf("[SUCCESS] [Vagrant Mode] PKGBUILD (Manjaro) protetto direttamente in: %s\n", outDir)
	} else {
		fmt.Printf("[SUCCESS] [Local Mode] PKGBUILD (Manjaro) generato correttamente in: %s\n", outDir)
	}
}
