package builder

import (
	"fmt"
	"os"
	"path/filepath"
)

// buildArchPackage genera il file PKGBUILD per Arch Linux.
// RISPETTA IL PATTO: In locale scrive nella repo, in Vagrant confina tutto in /tmp/oa-build.
func buildArchPackage(projRoot, oaDir, coaDir, baseVer, relNum string) {
	// 1. Applichiamo la logica di separazione degli spazi di lavoro
	outDir := projRoot
	buildDir := os.Getenv("BUILD_DIR")

	if buildDir != "" {
		outDir = buildDir // [Vagrant Mode]: Il PKGBUILD nasce e muore protetto in /tmp/oa-build
	} else {
		buildDir = "/tmp/oa-build" // [Local Mode]: La compilazione usa la RAM, ma il pacchetto torna a casa
	}

	// 2. Definiamo il contenuto del PKGBUILD (Con i puntamenti corretti a oaDir e coaDir)
	pkgbuildContent := fmt.Sprintf(`# Maintainer: Piero Proietti <piero.proietti@gmail.com>
# coa is the mind and oa the arm
pkgname=oa-tools-arch
pkgver=%s
pkgrel=%s
_srcdir="%s"
_oadir="%s"
_coadir="%s"
_build_dir="%s"
pkgdesc="oa-tools universal Linux remastering"
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

build() {
    rm -rf "${_build_dir}/oa" "${_build_dir}/coa"
    mkdir -p "${_build_dir}"

    msg2 "Compilazione del motore C (oa) nello schema ${_build_dir}..."
    cd "${_oadir}"
    make clean BUILD_DIR="${_build_dir}"
    make all BUILD_DIR="${_build_dir}"

    msg2 "Compilazione del motore Go (coa) nello schema ${_build_dir}..."
    cd "${_coadir}"
    mkdir -p "${_build_dir}/coa"
    go build -ldflags "-X 'coa/pkg/cmd.AppVersion=${pkgver}'" -o "${_build_dir}/coa/coa" main.go
}

package() {
    # Installazione binari dalla RAM
    install -Dm755 "${_build_dir}/oa/oa" "${pkgdir}/usr/bin/oa"
    install -Dm755 "${_build_dir}/coa/coa" "${pkgdir}/usr/bin/coa"
    ln -s coa "${pkgdir}/usr/bin/eggs"

    # Configurazione e logica agnostica dalla repo stanziale
    install -d "${pkgdir}/etc/oa-tools.d/brain.d"
    if [ -d "${_coadir}/brain.d" ]; then
        cp -r "${_coadir}/brain.d/"* "${pkgdir}/etc/oa-tools.d/brain.d/"
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

    if [ -d "${_srcdir}/conf" ]; then
        cp -r "${_srcdir}/conf/"* "${pkgdir}/etc/oa-tools.d/"
    fi

    # Documentazione e Completamenti nativi (Pescati da _coadir senza paracadute!)
    install -Dm644 "${_coadir}/docs/man/"*.1 -t "${pkgdir}/usr/share/man/man1/"
    install -Dm644 "${_coadir}/docs/completion/coa.bash" "${pkgdir}/usr/share/bash-completion/completions/coa"
    install -Dm644 "${_coadir}/docs/completion/coa.zsh" "${pkgdir}/usr/share/zsh/vendor-completions/_coa"
    install -Dm644 "${_coadir}/docs/completion/coa.fish" "${pkgdir}/usr/share/fish/vendor_completions.d/coa.fish"

    ln -s coa "${pkgdir}/usr/share/bash-completion/completions/eggs"
    ln -s _coa "${pkgdir}/usr/share/zsh/vendor-completions/_eggs"
    ln -s coa.fish "${pkgdir}/usr/share/fish/vendor_completions.d/eggs.fish"

    echo "complete -o default -F __start_coa eggs" >> "${pkgdir}/usr/share/bash-completion/completions/coa"
}
`, baseVer, relNum, projRoot, oaDir, coaDir, buildDir)

	// 3. Scrittura del file PKGBUILD nella destinazione corretta
	pkgbuildPath := filepath.Join(outDir, "PKGBUILD")
	err := os.WriteFile(pkgbuildPath, []byte(pkgbuildContent), 0644)
	if err != nil {
		fmt.Printf("[ERROR] Failed to write PKGBUILD: %v\n", err)
		return
	}

	if os.Getenv("BUILD_DIR") != "" {
		fmt.Printf("[SUCCESS] [Vagrant Mode] PKGBUILD (Arch) isolato in: %s\n", pkgbuildPath)
	} else {
		fmt.Printf("[SUCCESS] [Local Mode] PKGBUILD (Arch) stampato nella repo: %s\n", pkgbuildPath)
	}
}
