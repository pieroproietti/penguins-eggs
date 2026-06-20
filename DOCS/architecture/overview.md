# 🧠 Architecture Overview: `coa` (Orchestrator and worker (ell))

If the C engine (`oa`) is the mechanical arm that physically executes syscalls on the system, the Go binary **`coa`** is the mind. It analyzes the environment, reads the rules from the Brain (the YAML templates in `brain.d`), draws up the execution plan and issues the orders.

The whole command-line interface is built on the **Cobra** framework. This approach guarantees modularity, shell autocompletion and rigorous handling of system privileges.

---

## 🎛️ The Command Deck (the `cmd` package)

The `cmd` package contains the user interface. Each file maps a command the user can invoke. See the [Command Reference](../manual/commands.md) for the complete, user-facing documentation; the highlights:

| Command | Sudo | Role |
| :--- | :--- | :--- |
| `remaster` | Yes | The heart of the system. Starts the "flight" that produces the ISO: the `parser` reads the YAML rules, the `planner` writes the JSON plan, then the C binary is launched. Supports `--clone`, `--crypted` and `--stop-after` for surgical debugging. Alias: `produce`. |
| `destroy` | Yes | The safe destroyer (`kill` is kept as an alias). First runs the C engine with `oa cleanup` to unmount the virtual filesystems in `MNT_DETACH` mode (so the host never hangs), then physically removes the workspace and the log files. |
| `adapt` | No | Post-boot utility for virtual machines: iterates over the virtual video outputs and runs `xrandr --auto` to instantly fit the live session to the hypervisor window. |
| `export` | No | Network orchestrator with subcommands `iso`, `pkg` and `log`: sends artifacts over `scp` with SSH multiplexing to a remote Proxmox storage. The global `--clean` flag deletes old versions on the server before uploading. |
| `sysinstall` | Mixed | Parent command routing to the final installer: GUI (`calamares`) or TUI (`krill`). |
| `wardrobe` | No | Manages the costumes (themes/configurations) with `get`, `list`, `show` and `wear`. |
| `tools` | Mixed | Maintenance utilities: `build` (native packages), `clean`, `grub40`, `repo`, `skel`. |
| `config` | Yes | Interactive TUI for viewing and editing the configuration (`/etc/oa-tools.d/custom.yaml` and the custom exclude list). |
| `_gen_docs` | No | Hidden command used at build time to autogenerate Markdown docs, man pages and shell completions. |

---

## 🧬 The "Remaster" Dynamic: Parser, Planner and C

The architectural core is in `remaster.go`. When the user runs `sudo coa remaster`, the Go code triggers a chain reaction:

### 1. Detection and setup
First, `coa` uses `distro.NewDistro()` to understand which base it is landing on (Debian, Arch, Fedora, …) and computes the final output path of the egg (the ISO).

### 2. The Parser steps in (`parser.DetectAndLoad()`)
The **parser** loads the "score" from the Brain. It analyzes the YAML profile matching the detected distribution and validates the sequence of tasks (such as `coa-initrd`, `coa-bootloaders`, …). See [parser.md](./parser.md).

### 3. The JSON translator: the Planner (`planner.GeneratePlan()`)
Here the logical handover happens. The Go **planner** takes the YAML tree validated by the parser and compiles it into a *JSON flight plan*. See [planner.md](./planner.md).

*   **The breakpoint trick:** if the user passed `--stop-after` (e.g. `--stop-after coa-initrd`), the planner literally cuts the JSON plan at that step. The system stops mid-flight, leaving the *chroot* environment mounted and ready for manual inspection and debugging.
*   **Asset preparation:** in the same phase, Go ensures the bootloader binaries are present (`utils.EnsureBootloaders`) and generates the dynamic exclusion list (`planner.GenerateExcludeList`) according to the selected mode (`--clone` or `--crypted`).

### 4. The handoff to the C engine (`oa`)
At this point Go has finished the "intelligence" work and produced a complete, safe plan (the JSON file under `/tmp/coa/`). It runs `exec.Command("oa", planPath)` to invoke the low-level engine, wiring the C process `Stdout`/`Stderr` straight to the user's terminal so execution is visible in real time. If the C engine crashes, Go intercepts the exit code and stops everything with a red error log; on success it closes with the green success message.

---

This two-phase design (logic and abstraction in **Go** ➔ raw syscall execution in **C**) is what makes **oa-tools** a perfect hybrid: the maintainability and flexibility of modern Go, fused with the surgical isolation, speed and low-level safety of C.

---

## 📦 The Go packages at a glance

| Package | Role |
| :--- | :--- |
| `cmd` | All the Cobra commands (the CLI surface). |
| `parser` | Loads and validates the YAML profile from the Brain. → [parser.md](./parser.md) |
| `planner` | Compiles the validated profile into the JSON plan for `oa`. → [planner.md](./planner.md) |
| `distro` | Detects the host distribution from `/etc/os-release` (ID + ID_LIKE matching). |
| `dispatcher` | Routes `coa ell` tasks to the matching worker module. |
| `sysinstall/setup` | Generates the unified installer configuration (Calamares + Krill). → [installer.md](../design/installer.md) |
| `sysinstall/krill` | The native TUI installer (Bubbletea) and its engine. → [installer.md](../design/installer.md) |
| `builder` | Generates the native coa/oa packages (.deb, PKGBUILD, .rpm) for each distribution. |
| `bleach` | Cleanup routines for the various distributions. |
| `tailor` | The tailor managing the wardrobe (costumes). |
| `worker` | The Go modules executed on behalf of the C engine (`coa ell`). → [ell.md](./ell.md) |
| `context` | The structured `RuntimeContext` passed across packages. |
| `pathDefaults` | Centralized default paths (`/home/eggs`, `/tmp/coa`, log file). |
| `tui` | Reusable Bubbletea TUI components (confirm, password, select). |
| `assets` | Embedded assets (installer-base configuration and more). |
| `repo` | Management of the official package repository. |
| `xdg` | XDG helpers for the live session. |
| `utils` | Logging (`LogNormal/Success/Warning/Error/Fatal`), exec wrappers (`Exec/ExecQuiet/ExecCapture`) and general utilities. |
