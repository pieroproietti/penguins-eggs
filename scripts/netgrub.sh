#!/bin/sh

set -e

# Sets up a tftp server to netboot x86_64 systems over UEFI.
# Works on Ubuntu 13.10 and later.

# change to the root of your tftp server
TFTPROOT=/var/lib/tftpboot

# needed for unpacking the shim-signed source package
apt-get install dpkg-dev

tmpdir=$(mktemp -d)

cleanup () {
	if [ -n "$tmpdir" ]; then
		rm -rf "$tmpdir"
	fi
}

trap cleanup EXIT HUP INT QUIT PIPE TERM

cd "$tmpdir"
apt-get source shim-signed
cp shim-signed-*/shim.efi.signed "$TFTPROOT"/bootx64.efi

cd "$TFTPROOT"

wget -O grubx64.efi http://archive.ubuntu.com/ubuntu/dists/saucy/main/uefi/grub2-amd64/current/grubnetx64.efi.signed

# Unfortunately the unicode font is assembled by the grub2 package at
# build-time, so we can't grab it from the source; and we have no persistent
# URL for it since that changes with each version number; so try to install
# it (which should be a no-op on x86 anyway) and copy the contents.
apt-get install grub-common
mkdir -p grub/fonts
cp /usr/share/grub/unicode.pf2 grub/fonts

