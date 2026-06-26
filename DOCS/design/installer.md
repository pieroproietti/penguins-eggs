# `sysinstall`: Architecture of the Unified Installer

> **Status: implemented** (June 2026). This document describes the architecture
> as it exists in the codebase. The original design draft proposed the same
> "one engine, two faces" vision; what changed during implementation is noted
> in the [History](#history) section.

## 1. The Vision: One Engine, Two Faces

The installation process is agnostic with respect to the user interface, in
line with our **Universal Strategy**. A single preparation pipeline produces
the configuration; then one of two "faces" consumes it:

* **GUI (Graphical User Interface):** delegated to **Calamares**.
* **TUI (Text User Interface):** **Krill**, native Go (Bubbletea), aimed
  primarily at server sysadmins installing headless via console, serial or ssh.

## 2. The Single Source of Truth

The contract between the two worlds is the **finished configuration
directory**:

```
/etc/penguins-eggs.d/installer.d/
├── settings.conf        # the module sequence (show / exec) and instances
├── branding/eggs/       # branding.desc: product name, version, URLs
└── modules/*.conf       # partition, mount, users, unpackfs, removeuser, ...
```

The preparation pipeline (`prepareInstallerEnvironment` in `pkg/cmd`) runs
**always and once**, regardless of the chosen face: it loads the YAML profile,
inspects the live system (firmware, available filesystems, live user, display
manager, squashfs location) and writes the directory above. From that point on:

* **Calamares** is launched with `-c /etc/penguins-eggs.d/installer.d/` and does
  its own thing with its own C++/Python modules.
* **Krill** parses the same files (`pkg/krill/config.go`) and executes the
  same logical sequence with its own Go modules (`pkg/krill/engine`).

**Golden rule:** every per-distro difference (squashfs path, UEFI vs BIOS,
live user to remove, available filesystems) is baked into the generated
`.conf` files. Krill inherits it for free, with no parallel logic to keep in
sync. If a module is added to `settings.conf`, both installers see it.

## 3. Krill as a "Calamares-Core-Runner"

Krill is not an independent installer but a textual interpreter of the
Calamares configuration:

* It reads `settings.conf` and flattens the `exec` sequence.
* It maps each logical module onto a Go function in `pkg/krill/engine`:
  `partition` (sfdisk + mkfs), `mount`, `unpackfs` (unsquashfs), `machineid`,
  `fstab`, `locale` (+ timezone), `keyboard`, `users`, `displaymanager`,
  `removeuser`, `umount`.
* **`shellprocess@*` modules run verbatim**: the same `.conf` files and shell
  scripts that Calamares executes (bootloader included) are run by Krill in
  chroot, with the same `-` prefix convention for tolerated failures. Nothing
  is rewritten.
* Purely aesthetic modules (`welcome` slides, qml) are ignored.

Two implementation tricks worth knowing:

1. **The target mount point is `/tmp/calamares-root-krill`** on purpose: the
   existing bridge script `oa-bridge.sh` locates the target by
   globbing `/tmp/calamares-root-*`, so the bootloader scripts work unchanged
   under both installers.
2. **`networkcfg` is a Krill-only module** (Calamares does not configure the
   network at all). It is inserted into the exec sequence *after* `users` by
   Krill itself (`buildPlan`), without touching the shared `settings.conf`.
   With a static address it writes whatever the target understands: an
   ifupdown stanza, a NetworkManager keyfile, a systemd-networkd unit.

Everything the engine does is logged, command by command, to
`/var/log/krill.log`.

## 4. Package Layout

```
pkg/cmd/
├── sysinstall.go            # 'coa sysinstall' (parent command)
├── sysinstall_calamares.go  # GUI face: calls setup.Run()
└── sysinstall_krill.go      # TUI face (+ --unattended flag)

pkg/sysinstall/
├── krill/
│   ├── config.go            # reader of the finished configuration + live detection
│   ├── krill.go             # Bubbletea wizard (7 steps)
│   ├── unattended.go        # non-interactive install, same defaults as the TUI
│   └── engine/              # the executors (one Go module per logical step):
│       ├── engine.go        #   orchestration
│       ├── mount.go         #   mount/umount
│       ├── network.go       #   networkcfg (Krill-only)
│       ├── partition.go     #   sfdisk + mkfs
│       ├── shellprocess.go  #   verbatim shellprocess@* runner
│       ├── system.go        #   machineid, fstab, locale, keyboard
│       └── users.go         #   user creation, displaymanager, removeuser
└── setup/
    ├── orchestrator.go      # buildInstaller(): cascades all generators
    ├── types.go             # package-level constants (InstallerDRoot, etc.)
    ├── workspace.go         # initWorkspace(): creates the config dir tree
    ├── utils.go             # renderAndSaveEmbedded() template helper
    ├── qml-symlink.go       # QML symlink helper for Calamares GUI
    ├── sibling.go           # sibling detection helpers
    ├── bootloader-scripts.go# oa-bootloader.sh + oa-bridge.sh
    ├── shellprocess_bootloader_bridge.go
    ├── branding-desc.go     # branding/eggs/branding.desc
    ├── displaymanager-conf.go
    ├── mount-conf.go
    ├── partition-conf.go
    ├── removeuser-conf.go
    ├── unpack-conf.go
    ├── user-conf.go
    └── template/            # Go embed templates for every .conf and .sh
```

## 5. Bootloader Strategy

The bootloader script (`oa-bootloader.sh`, generated from `bootloader.sh.tmpl`) is
fully autonomous: it detects the environment at install time and picks the right
loader without any hardcoded distro assumption.

**Decision tree:**

| Firmware | Bootloader available | Family | Action |
|----------|----------------------|--------|--------|
| UEFI | `bootctl` (systemd-boot) | Arch, Manjaro | Install systemd-boot; copy kernel + initrd + ucode to EFI partition; write `loader.conf` + entry |
| UEFI | `grub-install` | any | Install GRUB EFI; run `update-grub` or `grub-mkconfig` |
| BIOS | `grub-install` | any | Install GRUB i386-pc on target disk |

**Safe mode:** if other OS entries are already present in `/boot/efi/EFI/`, the
script adds `--no-nvram` (GRUB) or `--no-variables` (bootctl) to avoid hijacking
the NVRAM boot order in multi-boot setups.

**Debian-family fix:** before the bootloader install, `update-initramfs -u` is
run with `RESUME=none` to strip the hibernation hook (irrelevant on a fresh
install target).

---

## 6. Modes of Use

```bash
sudo coa sysinstall calamares           # GUI
sudo coa sysinstall krill               # TUI wizard
sudo coa sysinstall krill --unattended  # no questions: live-user defaults,
                                        # password 'evolution', first disk,
                                        # 10-second abort countdown
```

The automatic dispatcher (`coa sysinstall` with no subcommand choosing the
face by detecting X11/Wayland and the calamares binary) is designed but not
yet implemented — see the [roadmap](./roadmap.md).

## 7. History

The original draft of this document proposed that Krill parse `settings.conf`
directly — which is what was built — but also imagined a separate `sysinstall/`
package tree with `engine/`, `adapters/` and a standalone dispatcher. In
practice the configuration generators grew naturally inside `pkg/sysinstall/setup`,
the shared pipeline was extracted into `pkg/cmd`, and Krill (reader + TUI +
engine) lives under `pkg/sysinstall/krill`. The decisive simplification was recognizing
that the **finished configuration directory is the only contract needed**
between the GUI and the TUI: since penguins-eggs generates those files itself,
Krill re-reading them is not duplication but the cheapest possible interface.
