package builder

import (
	"fmt"
	"os"
	"path/filepath"

	sysctx "coa/pkg/context" // Il nostro scudo contestuale
)

// packManjaro genera il file PKGBUILD specifico per Manjaro Linux.
// RISPETTA IL PATTO: Sfrutta il RuntimeContext per decidere se confinare in /tmp/oa-build o scrivere nella repo.
func packManjaro(baseVer string, relNum string, ctx sysctx.RuntimeContext) {
	// 1. Definiamo dove salvare il PKGBUILD tramite i campi del contesto
	var outDir string

	if ctx.EnvType == sysctx.EnvVagrant {
		// In Vagrant va direttamente nella radice di /tmp/oa-build al sicuro da 9p
		outDir = ctx.BaseBuildDir
	} else {
		// Local Mode: Scriviamo direttamente nella radice del progetto
		outDir = ctx.ProjRoot
	}

	// 2. Definiamo il contenuto del PKGBUILD per Manjaro usando i campi della struct ctx
	pkgbuildContent := fmt.Sprintf(`# Maintainer: Piero Proietti <piero.proietti@gmail.com>
# coa is the mind and oa the arm
pkgname=oa-tools-manjaro
pkgver=%s
pkgrel=%s
_srcdir="%s"
_build_dir="%s"
pkgdesc="oa-tools universal Linux remastering (Manjaro edition)"
arch=('x86_64')
license=('GPL3')
# Optimized Manjaro dependencies for oa-tools
depends=(
    'manjaro-tools-iso'      # Hook miso per initramfs (fondamentale su Manjaro)
    'efibootmgr'              # EFI
    'libisoburn'              # xorriso
    'squashfs-tools'         # mksquashfs
    'mtools'                 # manipolazione EFI img
    'dosfstools'             # mkfs.vfat
    'arch-install-scripts'   # arch-chroot
    'grub'                    # bootloader
    'rsync'                  # copia file
    'sudo'                    # privilegi
    'pv'                      # progress meter
    'git'                    # gestione wardrobe
    'bash-completion'
)

conflicts=('penguins-eggs' 'oa-tools')
backup=('etc/oa-tools.d/oa-tools.yaml')
options=(!debug)

build() {
    # Pulizia preventiva del workspace temporaneo in RAM
    rm -rf "${_build_dir}/oa" "${_build_dir}/coa"
    mkdir -p "${_build_dir}"

    msg2 "Compilazione del motore C (oa) nello schema ${_build_dir}..."
    cd "${_srcdir}/oa"
    make clean BUILD_DIR="${_build_dir}"
    make all BUILD_DIR="${_build_dir}"

    msg2 "Compilazione del motore Go (coa) nello schema ${_build_dir}..."
    cd "${_srcdir}/coa"
    mkdir -p "${_build_dir}/coa"
    go build -ldflags "-X 'coa/pkg/cmd.AppVersion=${pkgver}'" -o "${_build_dir}/coa/coa" main.go
}

package() {
    # 1. Installazione binari dallo schema specchio in RAM
    install -Dm755 "${_build_dir}/oa/oa" "${pkgdir}/usr/bin/oa"
    install -Dm755 "${_build_dir}/coa/coa" "${pkgdir}/usr/bin/coa"
    ln -s coa "${pkgdir}/usr/bin/eggs"

    # 2. Configurazione di sistema (/etc/oa-tools.d)
    install -d "${pkgdir}/etc/oa-tools.d/brain.d"

    if [ -d "${_srcdir}/coa/brain.d" ]; then
        msg2 "Installazione logica agnostica (brain.d)..."
        cp -r "${_srcdir}/coa/brain.d/"* "${pkgdir}/etc/oa-tools.d/brain.d/"
    fi

    # Generazione del file principale oa-tools.yaml (Dialetto oa)
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
        msg2 "Installazione file di configurazione addizionali..."
        cp -r "${_srcdir}/conf/"* "${pkgdir}/etc/oa-tools.d/"
    fi

    # 3. Documentazione e Completamenti
    install -Dm644 "${_srcdir}/coa/docs/man/"*.1 -t "${pkgdir}/usr/share/man/man1/" 2>/dev/null || true
    install -Dm644 "${_srcdir}/coa/docs/completion/coa.bash" "${pkgdir}/usr/share/bash-completion/completions/coa" 2>/dev/null || true
    install -Dm644 "${_srcdir}/coa/docs/completion/coa.zsh" "${pkgdir}/usr/share/zsh/vendor-completions/_coa" 2>/dev/null || true
    install -Dm644 "${_srcdir}/coa/docs/completion/coa.fish" "${pkgdir}/usr/share/fish/vendor_completions.d/coa.fish" 2>/dev/null || true

    ln -s coa "${pkgdir}/usr/share/bash-completion/completions/eggs"
    ln -s _coa "${pkgdir}/usr/share/zsh/vendor-completions/_eggs"
    ln -s coa.fish "${pkgdir}/usr/share/fish/vendor_completions.d/eggs.fish"

    echo "complete -o default -F __start_coa eggs" >> "${pkgdir}/usr/share/bash-completion/completions/coa"
}
`, baseVer, relNum, ctx.ProjRoot, ctx.BaseBuildDir)

	// Scrittura del file PKGBUILD direttamente nella cartella di output scelta
	pkgbuildPath := filepath.Join(outDir, "PKGBUILD")
	err := os.WriteFile(pkgbuildPath, []byte(pkgbuildContent), 0644)
	if err != nil {
		fmt.Printf("[ERROR] Failed to write PKGBUILD in %s: %v\n", outDir, err)
		return
	}

	if ctx.EnvType == sysctx.EnvVagrant {
		fmt.Printf("[SUCCESS] [Vagrant Mode] PKGBUILD (Manjaro) protetto direttamente in: %s\n", outDir)
	} else {
		fmt.Printf("[SUCCESS] PKGBUILD (Manjaro) generato correttamente in: %s\n", outDir)
	}
}
