# ⚙️ The Engineer: `planner` (Plan Translation and Compilation)

The `planner` package is the vital bridge between the YAML abstraction (read by the `parser`) and the raw syscalls of the C binary (`oa`). Its main job is to take the user's intentions and compile them into a rigorous JSON format, acting as a JIT (Just-In-Time) "compiler" right before execution.

This package executes no command on the system: it *prepares the ground* so that the C engine can do so without errors.

---

## 🏗️ 1. The Logical Expansion: `expandMountLogic()`

When the parser meets the abstract action `oa_mount_logic` in the YAML, the planner springs into action. That single directive is dynamically exploded into a complex sequence of low-level mount points:

1.  **Structure setup:** generates the `oa_mkdir` tasks that create the staging tree (`liveroot`, `upperdir`, `lowerdir`, …).
2.  **Physical copies:** emits `oa_cp` tasks to clone vital host trees such as `/etc` and `/boot`, including the dynamic copy of the kernel symlinks (`vmlinuz`, `initrd.img`).
3.  **The Usrmerge fix:** for the base directories (`/bin`, `/sbin`, `/lib`) it inspects the host with `os.Lstat`. If the directory is actually a *symlink* (the Usrmerge scenario, common on Debian/Ubuntu), it emits an `oa_shell` task replicating the link; if it is a real directory, it emits an `oa_bind`.
4.  **Dynamic OverlayFS:** for `/usr` and `/var` it instructs the C engine to build an Overlay filesystem, mounting the host directory as a read-only `lowerdir` and providing an `upperdir` and `workdir` for writability in the live environment.
5.  **API filesystems:** maps the essential virtual mounts (`proc`, `sys`, `dev`, `run`).
6.  **Chroot fix (`/tmp`):** issues a dedicated command mounting `/tmp` as an in-RAM `tmpfs`, forcing `1777` permissions (sticky bit) for safety and chroot compatibility.

---

## 🧹 2. Data Safety: `GenerateExcludeList()`

This function is the "privacy and performance filter". It generates `/tmp/coa/excludes.list`, which tells the `mksquashfs` compressor what *not* to include in the final ISO:

*   **The "double tap":** virtual APIs are excluded in two passes (e.g. `run/*` and `run/.??*`) so that no hidden host file slips in. A prime target is `var/tmp/.??*`, which removes heavy hidden temporary files.
*   **Caches and network:** removes package manager caches (`apt/*.bin`, `pacman/pkg/*`, `dnf/*`) and sensitive network data (`NetworkManager/system-connections/*`, host SSH keys).
*   **User privacy (mode):** with `--mode standard` the `root/*` folder is razed; with `clone` the user data survives but shell histories (`.bash_history`, `.zsh_history`) and trash bins (`.local/share/Trash/*`) are still purged.
*   **Custom exclusions:** if the user provides `/etc/oa-tools.d/exclusion.list`, the planner reads it, sanitizes the paths and appends the custom rules to the output file.

---

## ⚙️ 3. The JIT Compiler: `GeneratePlan()`

This is the planner's "main" function. It accepts the array of `parser.Step` structs and converts it into a JSON file saved at `/tmp/coa/oa-plan.json`.

### A. Variable resolution
The planner acts as a template engine, substituting on the fly variables such as `${ISO_OUTPUT}` with the real path computed in Go, and `${ISO_NAME}` with the target file name.

### B. Complex actions
*   **`oa_users`:** the planner prepares the `oa_shell` task copying the user skeleton from `/etc/skel`. It then reads the users declared in the YAML, retrieves the host user's groups through `utils.GetUserGroups()` and injects them into the live profile. If the YAML defines no users, a predefined "lifebelt" is used (user `live` with an encrypted password).
*   **The breakpoint (`stopAfter`):** if a breakpoint is active, the planner loops up to the requested task, sets `hitBreakpoint = true` and from that moment *discards* all subsequent tasks. It makes one vital exception, though: it always appends the `coa-cleanup` task at the end, guaranteeing the host is never left hanging with orphaned mount points.

### C. The embedding trick (the `types` file)
In `types.go` the planner defines the `OATask`. Instead of rewriting all the fields, it uses Go embedding (`parser.Step json:",inline"`): the task automatically "inherits" the action, the command and the users from the original YAML, and the planner only adds the technical fields the C binary needs (such as `Type`, `Opts` and `LiveRoot`).

This JSON structure, once written by `savePlan()`, is the perfect package that the C binary will load and execute to the letter.
