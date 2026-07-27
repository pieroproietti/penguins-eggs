# Quick Start


## Install

### From packages (recommended)

Packages are built automatically for every supported family. Download the latest from [GitHub Releases](https://github.com/pieroproietti/penguins-eggs/releases) or add the official repository:

```bash
sudo eggs tools repo add
```

### From source

```bash
git clone https://github.com/pieroproietti/penguins-eggs.git
cd penguins-eggs
make
sudo make install
```

Requirements: `gcc`, `make`, `golang` 1.25+, `git`.

## Your first ISO in three commands

```bash
# 1. Prepare the system (install squashfs-tools, xorriso, etc.)
sudo eggs tools repo add

# 2. Remaster the running system into a live ISO
sudo eggs remaster

# 3. Find your ISO
ls /home/eggs/*.iso
```

That's it. The ISO is hybrid (BIOS + UEFI) and ready to boot from USB or in a VM.

## Common workflows

### Customize the desktop, then remaster

```bash
# Apply a preset desktop configuration ("costume")
eggs wardrobe get
eggs wardrobe list
sudo eggs wardrobe wear colibri

# Build the ISO
sudo eggs remaster
```

### Customize compression and ISO naming

```bash
# Open the interactive configuration TUI
sudo eggs config
```

Change the live user password, the compression algorithm (zstd/xz/lz4/gzip), the compression level, the ISO filename prefix, and edit the custom exclude list — all from a single interface. Settings are saved to `/etc/penguins-eggs.d/custom.yaml` and applied automatically on the next `eggs remaster`.

### Remaster with LUKS encryption (Debian family)

```bash
sudo eggs remaster --crypted
```

An interactive TUI lets you choose the passphrase and crypto parameters. The resulting ISO boots into a LUKS-encrypted live environment.

### Install to disk from the live ISO

```bash
# GUI (requires Calamares and a display server)
sudo eggs sysinstall calamares

# TUI (works on console, serial, ssh)
sudo eggs sysinstall krill

# Headless / unattended
sudo eggs sysinstall krill --unattended
```

### Debug a remaster problem

```bash
# Stop after a specific step, leaving the chroot mounted for inspection
sudo eggs remaster --stop-after coa-initrd

# Print the JSON flight plan without building anything
sudo eggs remaster --debug

# Clean up after a failed or interrupted remaster
sudo eggs destroy
```

### Boot an ISO from the hard drive (no USB needed)

```bash
# Generate a GRUB loopback entry for any Linux ISO
eggs tools grub40 /path/to/my.iso

# Write it directly into /etc/grub.d/40_custom
sudo eggs tools grub40 /path/to/my.iso --write
sudo update-grub
```

## Supported distributions

penguins-eggs detects the host automatically. Currently supported families:

| Family | Examples |
|---|---|
| Alpine | Alpine Linux |
| Arch | Arch Linux, EndeavourOS, Garuda |
| Debian | Debian, Ubuntu, Pop!_OS, Linux Mint, Kali, MX Linux |
| Fedora | Fedora, Nobara |
| Manjaro | Manjaro, BigLinux |
| openSUSE | openSUSE Tumbleweed |

Adding a new distribution requires only a new template module directory under `brain.d/modules/` — no Go or C changes.


## Where to go next

- [Command Reference](./commands.md) — all commands, flags and options
- [Architecture Overview](../architecture/overview.md) — how the Mind (Go) and the Workhorse (C) work together
- [Installer Architecture](../design/installer.md) — Calamares and Krill: one engine, two faces
- [Roadmap](../design/roadmap.md) — what's done and what's next
