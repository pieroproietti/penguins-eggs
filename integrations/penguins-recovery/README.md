# penguins-recovery

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/5b40902c-3511-4ec2-99be-352832749d6f">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/0a0383a9-1a1e-416d-952e-5469ecf1fddc">
  <img alt="penguins-recovery banner" src="https://github.com/user-attachments/assets/0a0383a9-1a1e-416d-952e-5469ecf1fddc">
</picture>

Unified Linux system recovery toolkit. Combines multiple recovery and rescue
projects into a modular architecture with pluggable builders and distro-family
adapters.

## Structure

```
penguins-recovery/
├── adapters/                 # Layer recovery onto penguins-eggs naked ISOs
│   ├── adapter.sh            # Main entry point (auto-detects distro family)
│   ├── common/               # Shared adapter logic (extract, inject, repack)
│   ├── debian/               # apt-based installer
│   ├── fedora/               # dnf/yum-based installer
│   ├── arch/                 # pacman-based installer
│   ├── suse/                 # zypper-based installer
│   ├── alpine/               # apk-based installer
│   └── gentoo/               # emerge-based installer
├── bootloaders/              # Bootloader collection (system-packaged + source-built)
├── builders/
│   ├── debian/               # Debian-based rescue Live CD (from mini-rescue)
│   ├── arch/                 # Arch-based disk rescue image (from platter-engineer)
│   ├── uki/                  # Unified Kernel Image rescue (from rescue-image1)
│   ├── uki-lite/             # Lightweight UKI from host kernel (objcopy)
│   ├── lifeboat/             # Alpine-based single-file UEFI EFI (from lifeboat_linux)
│   └── rescatux/             # Rescatux live-build based rescue CD (from rescatux)
├── tools/
│   └── rescapp/              # GUI rescue wizard - Qt5/kdialog (from rescapp)
├── recovery-manager/         # Recovery partition management (from pop-os/upgrade)
├── common/
│   ├── tool-lists/           # Shared package definitions (all 6 distro families)
│   ├── scripts/              # Shared rescue scripts (chroot, GRUB, UEFI, passwords)
│   └── branding/             # Boot menus, splash screens, MOTD
└── integration/
    └── eggs-plugin/          # Integration hook for penguins-eggs
```

## Adapters (penguins-eggs naked ISO support)

The adapter system layers recovery tools onto any penguins-eggs naked ISO.
It auto-detects the distro family from `/etc/os-release` and uses the
appropriate package manager.

### Supported distro families

| Family | Package Manager | Distros |
|--------|----------------|---------|
| Debian | apt | Debian, Ubuntu, Pop!_OS, Linux Mint, LMDE, Devuan, MX, Zorin, elementary |
| Fedora/RHEL | dnf/yum | Fedora, AlmaLinux, Rocky Linux, CentOS, Nobara |
| Arch | pacman | Arch, EndeavourOS, Manjaro, BigLinux, Garuda, CachyOS |
| SUSE | zypper | openSUSE Leap/Tumbleweed/Slowroll, SLES |
| Alpine | apk | Alpine Linux |
| Gentoo | emerge | Gentoo, Funtoo, Calculate |

### Usage

```bash
# Basic: layer recovery tools onto a naked ISO
sudo make adapt INPUT=naked-debian-bookworm-amd64.iso

# With custom output name
sudo make adapt INPUT=naked-arch-amd64.iso OUTPUT=recovery-arch.iso

# Include rescapp GUI wizard
sudo make adapt INPUT=naked-ubuntu-noble-amd64.iso RESCAPP=1

# With Plasma GUI profile (minimal, touch, or full)
sudo make adapt INPUT=naked-debian-bookworm-amd64.iso GUI=minimal
sudo make adapt INPUT=naked-ubuntu-noble-amd64.iso GUI=touch RESCAPP=1
sudo make adapt INPUT=naked-arch-amd64.iso GUI=full

# Direct script usage
sudo ./adapters/adapter.sh --input naked.iso --output recovery.iso --gui minimal
sudo ./adapters/adapter.sh --input naked.iso --gui touch --with-rescapp

# From a URL
sudo ./adapters/adapter.sh --input https://sourceforge.net/.../naked-debian.iso --gui full
```

### How it works

1. Extracts the ISO and unsquashes the root filesystem
2. Detects the distro family from `/etc/os-release`
3. Installs recovery packages via the native package manager
4. Injects shared scripts, branding, and optionally rescapp
5. Repackages into a bootable hybrid ISO (BIOS + UEFI)

## GUI Profiles

Built on KDE Plasma Nano with optional components from Plasma Mobile and Desktop.

| Profile | Shell | RAM | Boot | Input | Use case |
|---------|-------|-----|------|-------|----------|
| `minimal` | plasma-nano | ~200MB | ~5s | Keyboard | Servers, low-RAM, kiosk |
| `touch` | plasma-nano + mobile | ~400MB | ~10s | Touch + keyboard | Tablets, touchscreens |
| `full` | plasma-desktop | ~800MB | ~15s | Mouse + keyboard | Desktop/laptop |

The recovery-launcher QML app provides a categorized grid of tasks across
all profiles, with a terminal menu fallback when no Qt runtime is available.

See [gui/README.md](gui/README.md) for architecture details.

## Standalone Builders

| Builder  | Base | Build Tool | Output | Source |
|----------|------|------------|--------|--------|
| debian   | Debian | debootstrap | ISO | [loaden/mini-rescue](https://github.com/loaden/mini-rescue) |
| arch     | Arch Linux | mkarchiso | ISO | [RouHim/platter-engineer](https://github.com/RouHim/platter-engineer) |
| uki      | Arch Linux | mkosi | EFI executable | [swsnr/rescue-image](https://github.com/swsnr/rescue-image) |
| uki-lite | host system | objcopy | EFI executable | — |
| lifeboat | Alpine Linux | custom shell scripts | ~35 MB EFI executable | [hugochinchilla/lifeboat_linux](https://github.com/hugochinchilla/lifeboat_linux) |
| rescatux | Debian | live-build | ISO | [rescatux/rescatux](https://github.com/rescatux/rescatux) |

## Tools

### Rescapp

GUI rescue wizard (Python3/Qt5) with plugin-based rescue tasks:
GRUB restore, Linux/Windows password reset, UEFI boot management,
filesystem check, disk partitioning, Windows MBR restore.

All GTK dependencies converted to Qt (kdialog, PyQt5 DBus).

## Shared Scripts

- `chroot-rescue.sh` -- Mount and chroot into an installed system (LUKS support)
- `detect-disks.sh` -- Display disk layout, LUKS, LVM, and EFI info
- `grub-restore.sh` -- Restore GRUB bootloader to MBR/EFI
- `password-reset.sh` -- Reset a Linux user's password from rescue
- `uefi-repair.sh` -- Check and repair UEFI boot entries

## Building

```bash
make help              # Show all targets
make adapt INPUT=naked.iso    # Layer recovery onto naked ISO
make bootloaders       # Package system-installed bootloaders
make bootloaders-src   # Clone and build bootloaders from source
make bootloaders-all   # Build source bootloaders then package everything
make debian            # Build Debian rescue ISO
make arch              # Build Arch rescue ISO
make uki               # Build UKI rescue EFI image
make uki-lite          # Build lightweight UKI from host kernel
make lifeboat          # Build Alpine-based single-file UEFI EFI
make rescatux          # Build Rescatux ISO
make clean             # Remove build artifacts
```

## License

GPL-3.0. The `builders/uki/` directory retains its original EUPL-1.2 license
(compatible with GPL-3.0 per the EUPL compatibility clause).

## Origins

This project unifies:
- [hugochinchilla/lifeboat_linux](https://github.com/hugochinchilla/lifeboat_linux) (Alpine-based single-file UEFI rescue EFI)
- [pieroproietti/penguins-bootloaders](https://github.com/pieroproietti/penguins-bootloaders)
- [loaden/mini-rescue](https://github.com/loaden/mini-rescue)
- [RouHim/platter-engineer](https://github.com/RouHim/platter-engineer)
- [swsnr/rescue-image](https://github.com/swsnr/rescue-image)
- [pop-os/upgrade](https://github.com/pop-os/upgrade)
- [rescatux/rescatux](https://github.com/rescatux/rescatux)
- [rescatux/rescapp](https://github.com/rescatux/rescapp)
- [pieroproietti/penguins-eggs](https://github.com/pieroproietti/penguins-eggs) (naked ISO support via adapters)
- [KDE/plasma-nano](https://invent.kde.org/plasma/plasma-nano) (GUI base shell)
- [KDE/plasma-mobile](https://invent.kde.org/plasma/plasma-mobile) (touch profile components)
- [KDE/plasma-desktop](https://invent.kde.org/plasma/plasma-desktop) (full profile components)
- [u-root/u-root](https://github.com/u-root/u-root) (Go-based initramfs/bootloader toolkit)
- [u-root/mkuimage](https://github.com/u-root/mkuimage) (bootable kernel image builder)
- [FyraLabs/submarine](https://github.com/FyraLabs/submarine) (Rust bootloader)
- [nihalpasham/rustBoot](https://github.com/nihalpasham/rustBoot) (secure Rust bootloader)
- [kexecboot/kexecboot](https://github.com/kexecboot/kexecboot) (kexec-based bootloader)
- [CloverHackyColor/CloverBootloader](https://github.com/CloverHackyColor/CloverBootloader) (UEFI bootloader)
- [RefindPlusRepo/RefindPlus](https://github.com/RefindPlusRepo/RefindPlus) (enhanced rEFInd boot manager)
- [RefindPlusRepo/RefindPlusUDK](https://github.com/RefindPlusRepo/RefindPlusUDK) (RefindPlus UDK build env)
- [openbootdotdev/openboot](https://github.com/openbootdotdev/openboot) (open-source boot firmware)
- [coreboot/coreboot](https://github.com/coreboot/coreboot) (open-source firmware)
- [u-boot/u-boot](https://github.com/u-boot/u-boot) (Universal Boot Loader)
- [linuxboot/linuxboot](https://github.com/linuxboot/linuxboot) (Linux-as-firmware)
- [linuxboot/heads](https://github.com/linuxboot/heads) (minimal boot firmware with TPM)
- [9elements/LinuxBootSMM](https://github.com/9elements/LinuxBootSMM) (LinuxBoot with SMM support)
- [systemd/systemd](https://github.com/systemd/systemd) (systemd-boot UEFI boot manager)
