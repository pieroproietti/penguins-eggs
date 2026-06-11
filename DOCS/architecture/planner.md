# ⚙️ The Engineer: `planner` (Plan Compilation)

The `planner` package is the bridge between the abstraction of the Brain (rendered by the `parser`) and the executors (`oa` in C, `coa ell` in Go). Its job is to compile the user's intentions into the *Single Source of Truth*: `/tmp/coa/oa-plan.json`, a JIT "compiler" running right before takeoff.

This package executes no command on the system: it *prepares the ground* so that the engines can work without surprises.

---

## 🧱 1. The Task Format: `OATask` (the embedding trick)

In `types.go` the planner defines `OATask` by **embedding** `parser.Step` as an anonymous field: thanks to JSON flattening, the task automatically inherits `name`, `module`, `chroot` and `params` from the Brain, and the planner only adds the technical fields the engines need at runtime:

* `work_dir` — the workspace root (e.g. `/home/eggs`), used by the native `umount` module;
* `live_root` — the resolved live filesystem path (`<work_dir>/liveroot`), used by `users` and by every chrooted Go worker;
* `type`, `opts`, `readonly` — legacy mount metadata kept for the transition.

The full plan (`OAPlan`) wraps the task array together with the `settings` and the `is_github_action` flag.

---

## ⚙️ 2. The Compiler: `GeneratePlan()`

`GeneratePlan()` iterates over `profile.Remaster` and switches on each step's `module`. Most steps pass through untouched — the planner just injects `live_root` — but a few modules are *expanded*:

### `mount_logic` → environment bootstrap
The single abstract directive becomes one `shell` task invoking `/etc/oa-tools.d/scripts/bootstrap-liveroot.sh <work_dir> <is_github_action>`, the script that builds the whole staging tree (liveroot, overlays, bind mounts, API filesystems).

### `users` → two concrete tasks (`oa-users.go`)
1. **`create-live-home`** (`shell`): creates the home directory and populates it from `/etc/skel`.
2. **`inject-live-users`** (`users`, native C): injects the identities. The live user comes from `settings` (fallback `live`); the password is hashed **in Go** by `hashPassword()` — already-hashed values (`$6$…`) pass through, plaintext is hashed with `openssl passwd -6`, and an empty password falls back to the default `eggs` hash. The groups of the host user are mirrored onto the live user via `utils.GetUserGroups()`.

### `umount` → the guaranteed cleanup
Compiled into the `cleanup` task carrying `work_dir`, executed natively by the C engine.

### `xorriso` → parameter injection + `.disk` metadata
The planner resolves `params.output_file` (the final ISO path computed from the distro identity) and `params.source_dir` (`<work_dir>/isodir`). Right before it, a **`coa-dot-disk`** shell task is inserted: it generates the `.disk` metadata directory (info, UUID from the kernel, timestamp) following the Debian live-boot standard.

### 🛑 The breakpoint (`--stop-after`)
If a breakpoint is set, once the named step has been compiled the planner *discards* every subsequent step — with one vital exception: the `cleanup` task is always kept, guaranteeing the host is never left with orphaned mounts. The environment stops mid-flight, mounted and ready for manual inspection.

### 🔧 The normalization pass
After the loop, a final pass enforces coherence: every task that declares a `work_dir` gets the real workspace path, every task that declares (or needs, because `chroot: true`) a `live_root` gets `<work_dir>/liveroot`. The Brain never has to spell out absolute paths.

### 🐞 `--debug`
With the debug flag, the plan is pretty-printed to the terminal and `coa` exits without remastering — the fastest way to inspect exactly what `oa` would receive.

The result is written by `savePlan()` to `/tmp/coa/oa-plan.json`.

---

## 🧹 3. Data Safety: `GenerateExcludeList()`

Called by `remaster` before planning, it generates `/tmp/coa/excludes.list` — what `mksquashfs` must *not* put into the ISO:

* **Virtual and temporary filesystems:** `dev`, `proc`, `sys`, `run`, `tmp`, `var/tmp` (including hidden files via the `.??*` pattern), plus the workspace itself (`home/eggs/.overlay`, `home/eggs/isodir`, previous `*.iso`).
* **System identity:** `etc/fstab`, `etc/mtab`, host SSH keys (`etc/ssh/ssh_host_*`), saved network connections (`NetworkManager/system-connections/*` and its `secret_key`), persistent udev rules, swapfile.
* **Package caches:** `apt` archives and the heavy `*.bin` indexes, `pacman/pkg`, `dnf`.
* **The Debian cryptdisks hack:** a single wildcard (`etc/rc*.d/*cryptdisks*`) — `mksquashfs -wildcards` does the scanning, no Go code needed.
* **Privacy by `--mode`:** in `standard` mode `root/*` (hidden files included) is razed; in `clone`/`crypted` user data survives but shell histories, trash bins and browser caches are still purged.
* **GitHub Actions slimming:** on a runner, `usr`, `var` and `opt` are stripped — the structural smoketest exercises the whole chain (mksquashfs, xorriso, umount) in minutes, producing a non-functional but valid ISO.
* **User exclusions:** `/etc/oa-tools.d/custom.exclude.list`, if present, is sanitized (comments skipped, leading slashes removed) and appended.

---

### 💡 Pro insight

The planner is the last point where *decisions* are made. Downstream of `oa-plan.json` there is only execution: `oa` walks the array and routes each task by `module` — natively in C or to `coa ell`. If something behaves unexpectedly, `coa remaster --debug` shows you the exact contract handed to the engines.
