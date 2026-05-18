package builder

import (
	"fmt"
	"os"
	"path/filepath"
)

// buildArchPackage genera il file PKGBUILD necessario per creare il pacchetto su Arch Linux.
// Integra la configurazione YAML in /etc/oa-tools.d e la gestione del wardrobe.
// buildArchPackage genera il file PKGBUILD necessario per creare il pacchetto su Arch Linux.
func buildArchPackage(projRoot, baseVer, relNum string) {
	// 1. Decidiamo dove salvare il PKGBUILD (dirottiamo su /tmp se siamo in Vagrant)
	outDir := projRoot
	buildDir := os.Getenv("BUILD_DIR")
	if buildDir != "" {
		outDir = filepath.Join(buildDir, "pkg") // Creiamo una sottocartella pulita
		os.MkdirAll(outDir, 0755)
	}

	// 2. Definiamo il contenuto del PKGBUILD.
	// NOTA: Iniettiamo projRoot in _srcdir così non dipendiamo da dove viene lanciato makepkg!
	pkgbuildContent := fmt.Sprintf(`# Maintainer: Piero Proietti <piero.proietti@gmail.com>
# coa is the mind and oa the arm
pkgname=oa-tools-arch
pkgver=%s
pkgrel=%s
_srcdir="%s"
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
)
conflicts=('penguins-eggs' 'oa-tools')
backup=('etc/oa-tools.d/oa-tools.yaml')
options=(!debug)

build() {
    export BUILD_DIR="/tmp/makepkg-oa-build"
    
    msg2 "Compilazione del motore C (oa) in ${BUILD_DIR}..."
    cd "${_srcdir}/oa"
    make clean BUILD_DIR="${BUILD_DIR}"
    make all BUILD_DIR="${BUILD_DIR}"

    msg2 "Compilazione del motore Go (coa) in ${BUILD_DIR}..."
    cd "${_srcdir}/coa"
    go build -ldflags "-X 'coa/pkg/cmd.AppVersion=${pkgver}'" -o "${BUILD_DIR}/coa/coa" main.go
}

package() {
    export BUILD_DIR="/tmp/makepkg-oa-build"

    # 1. Installazione binari
    install -Dm755 "${BUILD_DIR}/oa/oa" "${pkgdir}/usr/bin/oa"
    install -Dm755 "${BUILD_DIR}/coa/coa" "${pkgdir}/usr/bin/coa"
    ln -s coa "${pkgdir}/usr/bin/eggs"

    # 2. Configurazione
    install -d "${pkgdir}/etc/oa-tools.d/brain.d"

    if [ -d "${_srcdir}/coa/brain.d" ]; then
        msg2 "Installazione logica agnostica (brain.d)..."
        cp -r "${_srcdir}/coa/brain.d/"* "${pkgdir}/etc/oa-tools.d/brain.d/"
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
        msg2 "Installazione file di configurazione addizionali..."
        cp -r "${_srcdir}/conf/"* "${pkgdir}/etc/oa-tools.d/"
    fi

    # 3. Documentazione (aggiunto || true per evitare blocchi se i file mancano in dev)
    install -Dm644 "${_srcdir}/coa/docs/man/"*.1 -t "${pkgdir}/usr/share/man/man1/" 2>/dev/null || true

    # 4. Completamenti shell e alias
    install -Dm644 "${_srcdir}/coa/docs/completion/coa.bash" "${pkgdir}/usr/share/bash-completion/completions/coa" 2>/dev/null || true
    install -Dm644 "${_srcdir}/coa/docs/completion/coa.zsh" "${pkgdir}/usr/share/zsh/vendor-completions/_coa" 2>/dev/null || true
    install -Dm644 "${_srcdir}/coa/docs/completion/coa.fish" "${pkgdir}/usr/share/fish/vendor_completions.d/coa.fish" 2>/dev/null || true

    ln -s coa "${pkgdir}/usr/share/bash-completion/completions/eggs"
    ln -s _coa "${pkgdir}/usr/share/zsh/vendor-completions/_eggs"
    ln -s coa.fish "${pkgdir}/usr/share/fish/vendor_completions.d/eggs.fish"

    echo "complete -o default -F __start_coa eggs" >> "${pkgdir}/usr/share/bash-completion/completions/coa"
}
`, baseVer, relNum, projRoot)

	// Scrittura del file PKGBUILD
	pkgbuildPath := filepath.Join(outDir, "PKGBUILD")
	err := os.WriteFile(pkgbuildPath, []byte(pkgbuildContent), 0644)
	if err != nil {
		fmt.Printf("[ERROR] Failed to write PKGBUILD in %s: %v\n", outDir, err)
		return
	}
	fmt.Printf("[SUCCESS] PKGBUILD (Arch) generato correttamente in %s\n", outDir)
}
