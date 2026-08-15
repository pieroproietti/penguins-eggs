# 🛠️ `eggs` Command Reference

`eggs` is the primary command-line interface of the **penguins-eggs** project. Powered by the Go orchestrator (`coa`, meaning "to hatch") and the C native engine (`oa`, meaning "eggs"), it incubates your tasks: it delegates configuration logic to the *parser*, plan compilation to the *planner* (both in Go), and low-level execution to the C engine *oa*.

The binary is installed as `eggs` (with `coa` working interchangeably as an alias).

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
| **`config`** | 🟢 Yes | Interactive TUI for viewing and editing the configuration. |
| **`mcp`** | 🟡 Mixed | Model Context Protocol (MCP) server management for AI agents. |
| **`version`** | 🔴 No | Prints the eggs / coa version. |

---

## 🚀 Main Commands

### `eggs remaster`
The heart of the system. Reads the YAML profile through the parser, generates the JSON plan through the planner and executes the C engine to build the egg (the ISO).

*   **Usage:** `sudo eggs remaster [flags]`
*   **Flags:**
    *   `--clone`: clone mode — preserves users and `/home` in the ISO.
    *   `--crypted`: LUKS-encrypted mode — produces an encrypted squashfs (Debian family only). Mutually exclusive with `--clone`.
    *   `--path <string>`: working directory. Default: `/home/eggs`.
    *   `--stop-after <step>`: **[debug]** stops execution after a specific step (e.g. `coa-initrd`), leaving the *chroot* mounted for manual inspection.
    *   `--debug`: prints the JSON plan (or the pre-processed YAML) and exits without building anything.
*   **Alias:** `eggs produce` (legacy compatibility).

#### LUKS Encryption (`--crypted`)

When `--crypted` is passed, `eggs remaster` activates an interactive TUI wizard that asks for:

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

### `eggs sysinstall`
The orchestrator for installing the operating system to disk. Acts as a router toward the final installation engines.

*   **Usage:** `sudo eggs sysinstall <engine>`
*   **Engines:**
    *   `calamares`: launches the graphical installer (GUI).
    *   `krill`: launches the text installer (TUI).
        *   `--unattended`: non-interactive install with live-user defaults, password `evolution`, first disk, 10-second abort countdown.

### `eggs destroy` (alias: `eggs kill`)
The "safe destroyer". Tears down the remastering environment: it uses `MNT_DETACH` (lazy unmount) to free the virtual mount points (`/proc`, `/sys`, `/dev`) without kernel panics or host hangs, then deletes the working directory.

*   **Usage:** `sudo eggs destroy`

---

## 👔 Wardrobe (costumes)

### `eggs wardrobe`
Manages the wardrobe: ready-made desktop configurations ("costumes") that can be applied to the system before remastering.

*   **Subcommands:**
    *   `eggs wardrobe get`: downloads or updates the wardrobe.
    *   `eggs wardrobe list`: lists the available costumes.
    *   `eggs wardrobe show <costume>`: shows the details of a costume.
    *   `eggs wardrobe wear <costume>`: wears a costume from the wardrobe.
        *   `--no-acc`: skip accessory installation.
        *   `--no-firm`: skip firmware installation.

---

## ⚙️ Configuration

### `eggs config`
Interactive TUI for viewing and editing the penguins-eggs configuration. The settings are stored in `/etc/penguins-eggs.d/custom.yaml` and override the built-in defaults used by the parser during remastering.

*   **Usage:** `sudo eggs config`

The TUI is organized in three tabs (navigate with `Tab` / `Shift+Tab`):

#### Settings tab
Editable fields:

| Field | Default | Description |
|---|---|---|
| Password | `evolution` | Password for the live user. |
| Algorithm | `zstd` | Compression algorithm for mksquashfs (`zstd`, `xz`, `lz4`, `gzip`). |
| Level | `3` | Compression level (shown only when algorithm is `zstd`). |
| ISO prefix | *(auto)* | Custom prefix for the ISO filename. When empty, the distro name is used. |

Use `↑`/`↓` to move between fields, `←`/`→` to cycle the algorithm, and type to edit text fields.

#### Excludes tab
Shows the current content of `/etc/penguins-eggs.d/custom.exclude.list` and opens it in `$EDITOR` (default: `nano`) on `Enter`. Paths listed here are excluded from the squashfs during remastering.

#### Save tab
Choose **Save and exit** or **Exit without saving**. On save, the configuration is written to `/etc/penguins-eggs.d/custom.yaml`.

---

## 🤖 AI Agent & Model Context Protocol (`eggs mcp`)

### `eggs mcp`
Manages penguins-eggs integration with AI coding assistants and agent environments through the **Model Context Protocol (MCP)**. This allows tools like Google DeepMind Antigravity CLI, Anthropic Claude Desktop, Cursor, Zed, and VSCode Roo-Cline to discover system capabilities, trigger ISO remastering flights, inspect configuration, and run installers directly via JSON-RPC.

*   **Subcommands:**
    *   `eggs mcp enable`: Provisions `/etc/sudoers.d/penguins-eggs-mcp` for passwordless sudo execution of eggs commands and injects the penguins-eggs MCP server block into detected AI client configuration files.
        *   **Usage:** `sudo eggs mcp enable`
    *   `eggs mcp disable`: Removes penguins-eggs MCP configuration from client JSON files and purges `/etc/sudoers.d/penguins-eggs-mcp`.
        *   **Usage:** `sudo eggs mcp disable`
    *   `eggs mcp status`: Displays current status of sudoers rules, client JSON configurations, and any running MCP server background daemon processes.
        *   **Usage:** `eggs mcp status`
    *   `eggs mcp start`: Launches the interactive Stdio JSON-RPC 2.0 listener daemon. This command is invoked automatically by MCP clients when initializing the agent session. ANSI color styling is disabled automatically to guarantee protocol integrity.
        *   **Usage:** `eggs mcp start`
    *   `eggs mcp stop`: Finds and gracefully stops any active `eggs mcp start` background listener instances using `SIGTERM`.
        *   **Usage:** `eggs mcp stop`

#### Supported MCP Clients
When running `sudo eggs mcp enable`, the following client configuration files are automatically detected and configured:

| Client | Configuration Path |
|---|---|
| **Antigravity CLI** | `~/.config/antigravity/mcp.json` |
| **Claude Desktop** | `~/.config/Claude/claude_desktop_config.json` |
| **Roo-Cline (VSCode Server)** | `~/.vscode-server/data/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json` |
| **Roo-Cline (VSCode Local)** | `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json` |
| **Cursor Editor** | `~/.cursor/mcp.json` |
| **Zed Editor** | `~/.config/zed/settings.json` |

#### Exposed MCP Tools
AI agents connected via MCP can invoke the following tools:

| MCP Tool | Description | Parameters |
|---|---|---|
| `eggs_remaster` | Remasters the running system into a live bootable ISO. | `clone` (bool), `crypted` (bool), `compression` (string: `zstd`, `xz`, `lz4`, `gzip`), `path` (string), `stop_after` (string), `debug` (bool) |
| `eggs_wardrobe` | Manages and applies wardrobe presets and desktop costumes. | `action` (required: `list`, `get`, `show`, `wear`), `costume` (string) |
| `eggs_sysinstall` | Installs the live system environment permanently to local disk storage. | `installer` (`krill`, `calamares`), `unattended` (bool) |
| `eggs_export` | Exports artifacts (ISO, packages, logs) to remote Proxmox storage. | `target` (required: `iso`, `pkg`, `log`) |
| `eggs_tools` | Executes system utilities and maintenance tasks. | `tool` (required: `clean`, `grub40`, `skel`, `build`), `args` (string) |
| `eggs_destroy` | Cleans up the remaster workspace and unmounts temporary filesystems. | *(none)* |
| `eggs_version` | Retrieves runtime version, build architecture, and git commit details. | *(none)* |
| `eggs_exec` | Executes an arbitrary eggs command string safely. | `command` (required: string, e.g. `"remaster --clone"`) |

#### Exposed MCP Resources
AI agents can read system state directly using MCP resources:

| MCP Resource URI | Name | Description |
|---|---|---|
| `eggs://config` | Penguins Eggs Configuration | Contents of `/etc/penguins-eggs.conf` |
| `eggs://exclude-list` | Custom Exclude List | Contents of `/etc/penguins-eggs.d/custom.exclude.list` |
| `eggs://version` | Version Info | Build version, target architecture, and binary details |
| `eggs://status` | System Remaster Status | Host distribution, family, kernel release, and live environment status |

---

## 🧰 Utilities and Diagnostics

### `eggs adapt`
Post-boot utility designed for live environments booted in virtual machines (VirtualBox, QEMU/KVM, VMware). Maps the virtual video outputs and forces a dynamic resize (`xrandr --auto`) to fit the resolution to the hypervisor window.

*   **Usage:** `eggs adapt`

### `eggs tools`
Container for maintenance utilities:

*   `eggs tools build`: compiles the binaries and generates the native distribution packages (`.deb`, PKGBUILD, `.rpm`) for the host distribution.
*   `eggs tools clean`: cleans logs, apt/pacman caches and host system leftovers.
*   `eggs tools grub40 [path/to/iso]`: inspects any Linux ISO via `bsdtar`, automatically extracts its kernel path, initrd path and boot parameters, and generates the GRUB loopback configuration block to boot the ISO directly.
    *   `--write`, `-w`: injects the menu entry directly into `/etc/grub.d/40_custom`.
*   `eggs tools repo [add|rm]`: adds or removes the official penguins-eggs package repository.
*   `eggs tools skel`: builds `/etc/skel` from the current user's configuration.

---

## 📦 Artifact Management (Network)

### `eggs export`
Network orchestrator based on SSH multiplexing for fast, safe transfer of artifacts to a remote storage (e.g. a Proxmox node).

*   **Subcommands:**
    *   `eggs export iso`: finds the latest generated ISO in the nest and transfers it.
    *   `eggs export pkg`: finds the compiled native packages (`.deb`, `.rpm`, `.pkg.tar.zst`) for the distro family and sends them.
    *   `eggs export log`: exports logs and the JSON plan in a single shot.
        *   `--user, -u <user>`: destination SSH user.
        *   `--ip, -i <address>`: destination IP address.
        *   `--dir, -d <path>`: destination directory.
*   **Global flag:**
    *   `--clean`: before uploading, connects to the server and deletes the old versions of the artifact.

---

## ⚙️ Internal Commands

### `eggs ell` (or `coa ell`)
Executes a task delegated by the C engine (`oa`). Not meant to be invoked manually.

### `eggs _gen_docs`
Hidden command used by the toolchain (Makefile) at build time. Autogenerates:
1.  Markdown documentation.
2.  Man pages (`man 1 eggs`).
3.  Native shell completions for Bash, Zsh and Fish.

*   **Usage:** `eggs _gen_docs --target <dir>`
