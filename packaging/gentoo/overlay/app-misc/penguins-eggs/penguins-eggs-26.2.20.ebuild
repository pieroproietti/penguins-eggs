# Copyright 2024-2026 Gentoo Authors
# Distributed under the terms of the MIT License

EAPI=8

DESCRIPTION="A console tool that allows you to remaster your system and redistribute it as live images on USB sticks or via PXE"
HOMEPAGE="https://penguins-eggs.net https://github.com/pieroproietti/penguins-eggs"

# For a live ebuild (building from git), use:
# EGIT_REPO_URI="https://github.com/pieroproietti/penguins-eggs.git"
# inherit git-r3

# For a release tarball:
SRC_URI="https://github.com/pieroproietti/${PN}/archive/refs/tags/v${PV}.tar.gz -> ${P}.tar.gz"
S="${WORKDIR}/${P}"

LICENSE="MIT"
SLOT="0"
KEYWORDS="~amd64 ~arm64"

# Node.js >= 22 required
DEPEND="
	>=net-libs/nodejs-22[npm]
"

RDEPEND="
	>=net-libs/nodejs-22
	app-arch/squashfs-tools
	app-cdr/libisoburn
	app-misc/jq
	dev-libs/openssl
	dev-vcs/git
	net-misc/rsync
	net-misc/wget
	sys-apps/findutils
	sys-apps/pv
	sys-apps/util-linux
	sys-block/parted
	sys-boot/grub:2
	sys-boot/syslinux
	sys-fs/cryptsetup
	sys-fs/dosfstools
	sys-fs/erofs-utils
	sys-fs/lvm2
	sys-fs/mtools
	sys-kernel/dracut
	sys-libs/efivar
	x11-misc/xdg-utils
"

BDEPEND="
	>=net-libs/nodejs-22[npm]
	sys-apps/coreutils
"

src_compile() {
	# Install pnpm if not available
	if ! command -v pnpm &>/dev/null; then
		npm install -g pnpm || die "Failed to install pnpm"
	fi

	# Install dependencies and build
	NODE_ENV=development pnpm install || die "pnpm install failed"
	pnpm build || die "pnpm build failed"

	# Remove dev dependencies for packaging
	rm -rf node_modules
	pnpm install --prod || die "pnpm install --prod failed"
}

src_install() {
	# Install to /usr/lib/penguins-eggs
	local instdir="/usr/lib/${PN}"

	insinto "${instdir}"
	doins .oclif.manifest.json package.json

	# Copy runtime directories
	local dirs=(addons assets bin conf dist dracut eui mkinitcpio mkinitfs node_modules scripts)
	for d in "${dirs[@]}"; do
		if [[ -d "${d}" ]]; then
			cp -r "${d}" "${ED}${instdir}/" || die
		fi
	done

	# Documentation
	dodoc README.md

	# Man page
	doman manpages/doc/man/eggs.1.gz

	# Desktop file and icon
	insinto /usr/share/applications
	doins assets/${PN}.desktop

	insinto /usr/share/pixmaps
	doins assets/eggs.png

	# Make bin/run.js executable
	fperms +x "${instdir}/bin/run.js"

	# Make helper scripts executable
	fperms +x "${instdir}/scripts/mom.sh"
	if [[ -f "${ED}${instdir}/eui/eui-create-image.sh" ]]; then
		fperms +x "${instdir}/eui/eui-create-image.sh"
		fperms +x "${instdir}/eui/eui-start.sh"
		fperms 0400 "${instdir}/eui/eui-users"
	fi

	# Symlink executable
	dosym "${instdir}/bin/run.js" /usr/bin/eggs

	# Symlink adapt
	dosym "${instdir}/addons/eggs/adapt/bin/adapt" /usr/bin/adapt

	# Bash completion
	insinto /usr/share/bash-completion/completions
	dosym "${instdir}/scripts/eggs.bash" /usr/share/bash-completion/completions/eggs.bash

	# Zsh completion
	insinto /usr/share/zsh/site-functions
	dosym "${instdir}/scripts/_eggs" /usr/share/zsh/site-functions/_eggs
}

pkg_postinst() {
	elog "To configure penguins-eggs, run:"
	elog "  sudo eggs dad -d"
	elog ""
	elog "To create a live ISO of your system:"
	elog "  sudo eggs produce"
	elog ""
	elog "For the krill installer (CLI-based):"
	elog "  sudo eggs install"
	elog ""
	elog "Calamares (GUI installer) may not be available in the"
	elog "main Gentoo tree. You can use the krill installer instead,"
	elog "or add an overlay that provides calamares."
}
