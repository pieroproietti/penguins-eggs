# 🛠️ `coa` Command Reference

`coa` (which means "to hatch") is the universal orchestrator for system remastering and installation. As the command-line interface of the **oa-tools** project, it incubates your tasks: it delegates the configuration logic to the *parser*, the plan compilation to the *planner* (both in Go), and the low-level execution to the C native engine *oa* (eggs).

On systems migrating from penguins-eggs, the legacy alias `eggs` works interchangeably with `coa`.

> Tip: every command supports `--help`. Man pages and shell completions (Bash, Zsh, Fish) are generated at build time.

---

## 🧭 Quick Overview

| Command | Sudo | Description |
| :--- | :---: | :--- |
| **`remaster`** | 🟢 Yes | Builds the live ISO. |
| **`sysinstall`** | 🟡 Mixed | Launches the system installer (GUI or TUI) on the target. |
| **`destroy`** | 🟢 Yes | Unmounts the filesystems and safely cleans the workspace (`kill` is an alias). |
| **`adapt`** | 🔴 No | Dynamically adapts the video resolution inside a VM. |
| **`export`** | 🔴 No | Transfers artifacts (ISO/packages/logs) to a remote server. |
| **`wardrobe`** | 🟡 Mixed | Manages and applies the costumes (desktop configurations). |
| **`tools`** | 🟡 Mixed | Maintenance utilities: build, clean, grub40, repo, skel. |
| **`version`** | 🔴 No | Prints the coa version. |

---

## 🚀 Main Commands

### `coa remaster`
The heart of the system. Reads the YAML profile through the parser, generates the JSON plan through the planner and executes the C engine to build the egg (the ISO).

*   **Usage:** `sudo coa remaster [flags]`
*   **Flags:**
    *   `--clone`: clone mode — preserves users and `/home` in the ISO.
    *   `--crypted`: LUKS-encrypted mode — produces an encrypted squashfs (Debian family only). Mutually exclusive with `--clone`.
    *   `--path <string>`: working directory. Default: `/home/eggs`.
    *   `--stop-after <step>`: **[debug]** stops execution after a specific step (e.g. `coa-initrd`), leaving the *chroot* mounted for manual inspection.
    *   `--debug`: prints the JSON plan (or the pre-processed YAML) and exits without building anything.
*   **Alias:** `coa produce` (penguins-eggs compatibility).

#### LUKS Encryption (`--crypted`)

When `--crypted` is passed, `coa remaster` activates an interactive TUI wizard that asks for:

1. **Passphrase** — use the default (`0`) or enter a custom one. The passphrase is passed to `cryptsetup` via stdin and is never written to disk.
2. **Crypto configuration** — use the defaults or customize each parameter:

| Parameter | Default | Options |
|---|---|---|
| Cipher | `aes-xts-plain64` | `serpent-xts-plain64`, `twofish-xts-plain64` |
| Key size | 512 bit | 256 bit |
| Hash | `sha256` | `sha512` |
| Sector size | 512 byte | 4096 byte |
| PBKDF | `argon2id` | `argon2i`, `pbkdf2` |

The planner then modifies the flight plan: the standard `initramfs` and `copy-kernel-initrd` steps are replaced with LUKS-aware variants, and after `mksquashfs` a `luks-wrap-squashfs` step wraps `filesystem.squashfs` inside a LUKS2 ext4 container (`root.img`). The boot parameters are updated to include `live-media` for LUKS.

This feature is currently available for the **Debian family only**.

### `coa sysinstall`
The orchestrator for installing the operating system to disk. Acts as a router toward the final installation engines.

*   **Usage:** `sudo coa sysinstall <engine>`
*   **Engines:**
    *   `calamares`: launches the graphical installer (GUI).
    *   `krill`: launches the text installer (TUI).
        *   `--unattended`: non-interactive install with live-user defaults, password `evolution`, first disk, 10-second abort countdown.

### `coa destroy` (alias: `coa kill`)
The "safe destroyer". Tears down the remastering environment: it uses `MNT_DETACH` (lazy unmount) to free the virtual mount points (`/proc`, `/sys`, `/dev`) without kernel panics or host hangs, then deletes the working directory.

*   **Usage:** `sudo coa destroy`

---

## 👔 Wardrobe (costumes)

### `coa wardrobe`
Manages the wardrobe: ready-made desktop configurations ("costumes") that can be applied to the system before remastering.

*   **Subcommands:**
    *   `coa wardrobe get`: downloads or updates the wardrobe.
    *   `coa wardrobe list`: lists the available costumes.
    *   `coa wardrobe show <costume>`: shows the details of a costume.
    *   `coa wardrobe wear <costume>`: wears a costume from the wardrobe.
        *   `--no-acc`: skip accessory installation.
        *   `--no-firm`: skip firmware installation.

---

## 🧰 Utilities and Diagnostics

### `coa adapt`
Post-boot utility designed for live environments booted in virtual machines (VirtualBox, QEMU/KVM, VMware). Maps the virtual video outputs and forces a dynamic resize (`xrandr --auto`) to fit the resolution to the hypervisor window.

*   **Usage:** `coa adapt`

### `coa tools`
Container for maintenance utilities:

*   `coa tools build`: compiles the binaries and generates the native distribution packages (`.deb`, PKGBUILD, `.rpm`) for the host distribution.
*   `coa tools clean`: cleans logs, apt/pacman caches and host system leftovers.
*   `coa tools grub40 [path/to/iso]`: inspects any Linux ISO via `bsdtar`, automatically extracts its kernel path, initrd path and boot parameters, and generates the GRUB loopback configuration block to boot the ISO directly.
    *   `--write`, `-w`: injects the menu entry directly into `/etc/grub.d/40_custom`.
*   `coa tools repo [add|rm]`: adds or removes the official penguins-eggs package repository.
*   `coa tools skel`: builds `/etc/skel` from the current user's configuration.

---

## 📦 Artifact Management (Network)

### `coa export`
Network orchestrator based on SSH multiplexing for fast, safe transfer of artifacts to a remote storage (e.g. a Proxmox node).

*   **Subcommands:**
    *   `coa export iso`: finds the latest generated ISO in the nest and transfers it.
    *   `coa export pkg`: finds the compiled native packages (`.deb`, `.rpm`, `.pkg.tar.zst`) for the distro family and sends them.
    *   `coa export log`: exports logs and the JSON plan in a single shot.
        *   `--user, -u <user>`: destination SSH user.
        *   `--ip, -i <address>`: destination IP address.
        *   `--dir, -d <path>`: destination directory.
*   **Global flag:**
    *   `--clean`: before uploading, connects to the server and deletes the old versions of the artifact.

---

## ⚙️ Internal Commands

### `coa ell`
Executes a task delegated by the C engine. Not meant to be invoked manually.

### `coa _gen_docs`
Hidden command used by the toolchain (Makefile) at build time. Autogenerates:
1.  Markdown documentation.
2.  Man pages (`man 1 coa`).
3.  Native shell completions for Bash, Zsh and Fish.

*   **Usage:** `coa _gen_docs --target <dir>`
