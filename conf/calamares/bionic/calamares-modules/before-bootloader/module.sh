# apt-cdrom add -m -d=/media/cdrom/
sed -i ' / deb http / d' /etc/apt/sources.list.d/official-package-repositories.list
apt-get update
apt install -y --no-upgrade -o Acquire::gpgv::Options::=--ignore-time-conflict grub-efi-$(if grep -q 64 /sys/firmware/efi/fw_platform_size; then echo amd64-signed; else echo ia32; fi)
#apt install -y --no-upgrade -o Acquire::gpgv::Options::=--ignore-time-conflict shim-signed
