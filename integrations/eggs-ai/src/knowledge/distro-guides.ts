/**
 * Distro-specific installation and usage guides for penguins-eggs.
 * Embedded as AI context so the agent gives accurate per-distro advice.
 */

export const DISTRO_INSTALL_GUIDES: Record<string, string> = {
  'debian': `
## Installing penguins-eggs on Debian (bookworm/trixie/sid)

### From the PPA (recommended)
curl -fsSL https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/penguins-eggs.gpg
echo "deb [signed-by=/etc/apt/trusted.gpg.d/penguins-eggs.gpg] https://pieroproietti.github.io/penguins-eggs-ppa ./" | sudo tee /etc/apt/sources.list.d/penguins-eggs.list
sudo apt update
sudo apt install eggs

### From npm (alternative)
sudo npm i -g penguins-eggs

### First-time setup
sudo eggs dad -d          # Install all prerequisites non-interactively
sudo eggs calamares -i    # Install Calamares GUI installer (optional)

### Produce an ISO
sudo eggs produce         # Standard compression
sudo eggs produce --max   # Maximum compression (slower, smaller ISO)

### Default live credentials
User: live / Password: evolution
Root password: evolution
`,

  'ubuntu': `
## Installing penguins-eggs on Ubuntu (jammy/noble/oracular/plucky) and derivatives

### From the PPA
sudo add-apt-repository ppa:penguins-eggs/daily
sudo apt update
sudo apt install eggs

### Alternative: direct .deb download
Visit https://sourceforge.net/projects/penguins-eggs/files/DEBS/
Download the latest eggs_*.deb for your architecture
sudo dpkg -i eggs_*.deb
sudo apt -f install   # Fix any missing dependencies

### First-time setup
sudo eggs dad -d
sudo eggs calamares -i

### Notes for Ubuntu
- Ubuntu uses snap by default; eggs works with both snap and deb packages
- For Ubuntu derivatives (Mint, KDE neon, Pop!_OS), the same PPA works
- LMDE (Linux Mint Debian Edition) should use the Debian instructions instead
`,

  'arch': `
## Installing penguins-eggs on Arch Linux and derivatives (Manjaro, EndeavourOS)

### From AUR
yay -S penguins-eggs
# or
paru -S penguins-eggs

### From npm
sudo npm i -g penguins-eggs

### First-time setup
sudo eggs dad -d
sudo eggs calamares -i

### Arch-specific notes
- Arch uses mkinitcpio for initramfs; eggs handles this automatically
- For Manjaro, the same AUR package works
- Calamares on Arch may need: sudo pacman -S calamares
- The wardrobe system has Arch-specific costumes
`,

  'fedora': `
## Installing penguins-eggs on Fedora

### From npm (primary method)
sudo npm i -g penguins-eggs

### From AppImage
Download from https://sourceforge.net/projects/penguins-eggs/files/APPIMAGE/
chmod +x eggs-*.AppImage
sudo ./eggs-*.AppImage dad -d

### First-time setup
sudo eggs dad -d
sudo eggs calamares -i

### Fedora-specific notes
- Fedora uses dracut for initramfs; eggs supports this
- SELinux may need to be set to permissive during ISO creation
- DNF package cache can be large; clean with: sudo dnf clean all
`,

  'opensuse': `
## Installing penguins-eggs on openSUSE (Tumbleweed/Leap)

### From npm
sudo npm i -g penguins-eggs

### From AppImage
Download from https://sourceforge.net/projects/penguins-eggs/files/APPIMAGE/

### First-time setup
sudo eggs dad -d
sudo eggs calamares -i

### openSUSE-specific notes
- openSUSE uses dracut for initramfs
- Tumbleweed is rolling release; ensure eggs is updated frequently
- Leap has more stable packages but may need newer Node.js from NodeSource
`,

  'alpine': `
## Installing penguins-eggs on Alpine Linux

### From npm
sudo npm i -g penguins-eggs

### First-time setup
sudo eggs dad -d

### Alpine-specific notes
- Alpine uses mkinitfs for initramfs; eggs supports this
- Alpine uses musl libc; some Node.js packages may need native compilation
- Calamares is not available on Alpine; use the krill TUI installer instead:
  sudo eggs install
- Alpine's small footprint makes it ideal for minimal rescue ISOs
`,

  'void': `
## Installing penguins-eggs on Void Linux

### From npm
sudo npm i -g penguins-eggs

### First-time setup
sudo eggs dad -d

### Void-specific notes
- Void uses dracut for initramfs
- Void uses runit instead of systemd; eggs handles both
- Calamares may not be available; use krill installer:
  sudo eggs install
`,
};

export const ADVANCED_WORKFLOWS = {
  'clone-system': `
## Cloning a running system

Clone mode copies user data and configurations into the ISO:

sudo eggs produce --clone

For encrypted clone (LUKS):
sudo eggs produce --cryptedclone

Notes:
- Clone ISOs are larger because they include /home
- Useful for backup/migration of a configured system
- The --release flag should NOT be used with clone (it strips eggs)
`,

  'pxe-network-boot': `
## PXE Network Boot with Cuckoo

Eggs can serve a live ISO over the network:

sudo eggs cuckoo

This starts a PXE/TFTP/DHCP server that allows other machines on the
same network to boot the live system without USB/CD.

Requirements:
- The machine running cuckoo must have a wired network connection
- Other machines must support PXE boot (most do via BIOS/UEFI)
- No other DHCP server should be on the same network segment
`,

  'wardrobe-custom-costume': `
## Creating a custom wardrobe costume

1. Get the wardrobe:
   sudo eggs wardrobe get

2. List existing costumes:
   eggs wardrobe list

3. Copy an existing costume as a template:
   cp -r ~/.wardrobe/costumes/colibri ~/.wardrobe/costumes/my-costume

4. Edit the costume YAML:
   nano ~/.wardrobe/costumes/my-costume/index.yml

5. The YAML defines:
   - packages: list of packages to install
   - packages_no_install_recommends: packages without recommends
   - debs: local .deb files to install
   - dirs: directories to copy into the system
   - hostname: system hostname
   - reboot: whether to reboot after wearing

6. Apply your costume:
   sudo eggs wardrobe wear --costume my-costume
`,

  'unattended-install': `
## Unattended installation

For automated deployments:

sudo eggs install --unattended

This uses the krill TUI installer in non-interactive mode.
Default values are used for partitioning, user creation, etc.

For custom unattended config:
sudo eggs install --unattended --domain mydomain.local --ip

The --ip flag configures static IP instead of DHCP.
`,

  'release-mode': `
## Release mode (distributing your ISO)

When creating an ISO for distribution to others:

sudo eggs produce --release

This removes penguins-eggs and calamares from the final ISO,
so end users get a clean system without the remastering tools.

Combine with other flags:
sudo eggs produce --release --max --prefix MyDistro --basename v1.0
`,

  'compression-guide': `
## Compression options

--compression fast (or --fast)
  Uses lz4 compression. Fastest build, largest ISO.
  Good for: testing, development, quick iterations.

--compression standard (default)
  Uses zstd compression. Balanced speed and size.
  Good for: general use.

--compression max (or --max)
  Uses xz compression. Slowest build, smallest ISO.
  Good for: final releases, distribution.

Typical size differences for a 4GB system:
  fast:     ~2.5 GB ISO, ~3 min build
  standard: ~1.8 GB ISO, ~8 min build
  max:      ~1.4 GB ISO, ~20 min build
`,
};

export const TROUBLESHOOTING_ADVANCED = [
  {
    symptom: 'eggs produce hangs at "Creating squashfs filesystem"',
    diagnosis: 'Squashfs compression is CPU-intensive. With --max on slow hardware, this can take 30+ minutes.',
    fix: 'Use --fast for testing. Check CPU usage with htop. Ensure sufficient RAM (4GB+ recommended).',
  },
  {
    symptom: 'Calamares shows "No EFI system partition" error',
    diagnosis: 'The target disk needs an EFI System Partition (ESP) for UEFI boot.',
    fix: 'In Calamares partitioning, create a 512MB FAT32 partition with "boot" and "esp" flags. Or use manual partitioning.',
  },
  {
    symptom: 'Live ISO boots but no display manager / black screen after login',
    diagnosis: 'Display manager or GPU drivers missing from the ISO.',
    fix: 'Ensure lightdm/sddm/gdm is installed before producing. For NVIDIA: include nvidia-driver package. Check /var/log/Xorg.0.log in the live session.',
  },
  {
    symptom: 'eggs dad fails with "cannot find module" errors',
    diagnosis: 'Node.js version mismatch or corrupted installation.',
    fix: 'Reinstall eggs: sudo npm i -g penguins-eggs. Ensure Node.js 18+. On Debian: sudo apt install --reinstall eggs.',
  },
  {
    symptom: 'ISO works in VM but not on real hardware',
    diagnosis: 'Missing firmware packages (WiFi, GPU, etc.) or Secure Boot issues.',
    fix: 'Install firmware-linux-nonfree (Debian) or linux-firmware (Arch/Fedora). Disable Secure Boot in BIOS for testing.',
  },
  {
    symptom: 'wardrobe wear fails with package dependency errors',
    diagnosis: 'The costume requires packages not available in your repositories.',
    fix: 'Check the costume YAML for distro-specific package names. Some costumes are Debian-only. Update package lists: sudo apt update.',
  },
  {
    symptom: 'ISO file is 0 bytes or missing after produce',
    diagnosis: 'Build failed silently, or snapshot_dir is on a read-only filesystem.',
    fix: 'Run with --verbose to see errors. Check snapshot_dir in eggs.yaml. Ensure /home/eggs (default) has write permissions and space.',
  },
  {
    symptom: 'krill installer fails with "cannot mount target"',
    diagnosis: 'Target partition is busy or filesystem type not supported.',
    fix: 'Ensure no partitions are mounted. Use ext4 for root. Check: lsblk and umount any target partitions.',
  },
];
