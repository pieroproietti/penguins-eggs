# Gentoo Packaging for Penguins-Eggs

## Using the overlay

Add the overlay to your system:

```bash
# Create the repos.conf entry
cat > /etc/portage/repos.conf/penguins-eggs.conf << 'EOF'
[penguins-eggs]
location = /var/db/repos/penguins-eggs
sync-type = git
sync-uri = https://github.com/pieroproietti/penguins-eggs.git
auto-sync = no
EOF

# Or manually copy the overlay directory
cp -r overlay/* /var/db/repos/penguins-eggs/
```

## Install

```bash
emerge --ask app-misc/penguins-eggs
```

## Configure

```bash
sudo eggs dad -d
```

## Create a live ISO

```bash
sudo eggs produce
```

## Dependencies

The ebuild requires:
- Node.js >= 22
- dracut (for initramfs generation)
- squashfs-tools, grub, syslinux (for ISO creation)
- Standard system utilities (rsync, parted, cryptsetup, etc.)
