# Quick Start

## Coming from penguins-eggs?

oa-tools is the next-generation successor of penguins-eggs, rewritten in C+Go for speed and reliability. If you already know `eggs`, you already know `oa-tools`: the binary is installed as both `coa` and `eggs`, so your muscle memory keeps working.

| penguins-eggs | oa-tools | Notes |
|---|---|---|
| `sudo eggs produce` | `sudo eggs produce` | Same command, same result |
| `sudo eggs produce` | `sudo coa remaster` | Native name, identical behavior |
| `sudo eggs kill` | `sudo eggs kill` | Works as before |
| `sudo eggs kill` | `sudo coa destroy` | Native name |
| `sudo eggs install` | `sudo coa sysinstall krill` | TUI installer |
| `sudo eggs calamares` | `sudo coa sysinstall calamares` | GUI installer |
| `eggs adapt` | `coa adapt` | VM screen resize |
| `eggs tools skel` | `coa tools skel` | Rebuild /etc/skel |
| `eggs wardrobe wear colibri` | `coa wardrobe wear colibri` | Apply a costume |

In short: replace `eggs` with `coa` if you want, or keep using `eggs` — both work.

## Install

### From packages (recommended)

Packages are built automatically for every supported family. Download the latest from [GitHub Releases](https://github.com/pieroproietti/oa-tools/releases) or add the official repository:

```bash
sudo coa tools repo add
```

### From source

```bash
git clone https://github.com/pieroproietti/oa-tools.git
cd oa-tools
make
sudo make install
```

Requirements: `gcc`, `make`, `golang` 1.25+, `git`.

## Your first ISO in three commands

```bash
# 1. Prepare the system (install squashfs-tools, xorriso, etc.)
sudo coa tools repo add

# 2. Remaster the running system into a live ISO
sudo coa remaster

# 3. Find your ISO
ls /home/eggs/*.iso
```

That's it. The ISO is hybrid (BIOS + UEFI) and ready to boot from USB or in a VM.

## Common workflows

### Customize the desktop, then remaster

```bash
# Apply a preset desktop configuration ("costume")
coa wardrobe get
coa wardrobe list
sudo coa wardrobe wear colibri

# Build the ISO
sudo coa remaster
```

### Remaster with LUKS encryption (Debian family)

```bash
sudo coa remaster --crypted
```

An interactive TUI lets you choose the passphrase and crypto parameters. The resulting ISO boots into a LUKS-encrypted live environment.

### Install to disk from the live ISO

```bash
# GUI (requires Calamares and a display server)
sudo coa sysinstall calamares

# TUI (works on console, serial, ssh)
sudo coa sysinstall krill

# Headless / unattended
sudo coa sysinstall krill --unattended
```

### Debug a remaster problem

```bash
# Stop after a specific step, leaving the chroot mounted for inspection
sudo coa remaster --stop-after coa-initrd

# Print the JSON flight plan without building anything
sudo coa remaster --debug

# Clean up after a failed or interrupted remaster
sudo coa destroy
```

### Boot an ISO from the hard drive (no USB needed)

```bash
# Generate a GRUB loopback entry for any Linux ISO
coa tools grub40 /path/to/my.iso

# Write it directly into /etc/grub.d/40_custom
sudo coa tools grub40 /path/to/my.iso --write
sudo update-grub
```

## Supported distributions

oa-tools detects the host automatically. Currently supported families:

| Family | Examples |
|---|---|
| Alpine | Alpine Linux |
| Arch | Arch Linux, EndeavourOS, Garuda |
| Debian | Debian, Ubuntu, Pop!_OS, Linux Mint, Kali, MX Linux |
| Fedora | Fedora, Nobara |
| Manjaro | Manjaro, BigLinux |
| openSUSE | openSUSE Tumbleweed |

Adding a new distribution requires only a new template module in `brain.d/modules/` — no Go or C changes.

## Where to go next

- [Command Reference](./commands.md) — all commands, flags and options
- [Architecture Overview](../architecture/overview.md) — how the Mind (Go) and the Workhorse (C) work together
- [Installer Architecture](../design/installer.md) — Calamares and Krill: one engine, two faces
- [Roadmap](../design/roadmap.md) — what's done and what's next
