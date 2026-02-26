# Copyright 2024-2026 Gentoo Authors
# Distributed under the terms of the GNU General Public License v2

EAPI=8

DESCRIPTION="A remaster system tool for creating live ISOs from running systems"
HOMEPAGE="https://penguins-eggs.net https://github.com/pieroproietti/penguins-eggs"
SRC_URI="https://github.com/pieroproietti/${PN}/releases/download/v${PV}/${PN}-v${PV}-linux-x64.tar.gz"

LICENSE="MIT"
SLOT="0"
KEYWORDS="amd64"
IUSE=""

# Runtime dependencies for live ISO production
RDEPEND="
	app-arch/xorriso
	sys-fs/squashfs-tools
	sys-kernel/dracut
	sys-apps/dosfstools
	sys-boot/grub:2
	sys-boot/syslinux
	net-misc/rsync
	app-shells/bash
	dev-lang/nodejs
"

# ChromiumOS-specific: these may come from Portage, Gentoo Prefix, or Chromebrew
PDEPEND="
	app-portage/gentoolkit
"

S="${WORKDIR}/${PN}"

src_install() {
	# Install the penguins-eggs application
	insinto /usr/lib/penguins-eggs
	doins -r .

	# Create the eggs command symlink
	dosym ../lib/penguins-eggs/bin/run /usr/bin/eggs

	# Make the binary executable
	fperms +x /usr/lib/penguins-eggs/bin/run
	fperms +x /usr/lib/penguins-eggs/bin/node
}

pkg_postinst() {
	elog "Penguins-eggs installed. Run 'sudo eggs dad -d' to configure."
	elog ""
	elog "ChromiumOS family support includes:"
	elog "  ChromiumOS, ChromeOS, FydeOS/openFyde, ThoriumOS, WayneOS, Brunch"
	elog ""
	elog "On ChromeOS with Chromebrew, ensure squashfs-tools and dracut are installed:"
	elog "  crew install squashfs_tools"
	elog ""
	elog "On ChromeOS with Gentoo Prefix (sebanc/chromeos-gentoo-prefix):"
	elog "  emerge squashfs-tools dracut xorriso"
}
