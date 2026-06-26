# 🛠️ The Go Craftsman: `coa ell`

`ell` is the third actor of the [philosophy](../design/philosophy.md): the specialized technician that replaced Bash scripting for all high-level operations. It is not a separate binary — it is a subcommand of `coa` (*multi-call binary* pattern, like Git or Docker), so the end user keeps downloading just two executables while `oa` (C) gains a full Go toolbox at its service.

---

## 📬 The Envelope Protocol (`cmd/ell.go` + `dispatcher`)

When the C foreman meets a task whose `module` is not native (see [oa.md](./oa.md)), it forks and pipes the *single task* as raw JSON into the STDIN of `coa ell`. On the Go side the flow is minimal:

1. **`ell`** reads the whole payload from STDIN and hands it, untouched, to the dispatcher.
2. **`dispatcher.RouteTask()`** performs a *partial* unmarshal — it peeks only at the `module` (and `chroot`, for logging) field, ignoring everything else.
3. The switch routes the **raw bytes** to the matching worker, which performs its own second unmarshal against a local, module-specific struct.

This "envelope" design keeps the packages decoupled: there is no mega-struct shared across the project — each worker declares exactly the parameters it needs and nothing more. An unknown `module` is an immediate, explicit error.

---

## 🧰 The Worker Modules (`pkg/worker`)

| Module | File | Role |
| :--- | :--- | :--- |
| `shell` | `shell.go` | Executes an inline command/script. |
| `script` | `scripts.go` | Executes a script file taken from the host, with optional arguments. |
| `template` | `template.go` | Renders a Go `text/template` with variables and writes it to disk. |
| `copy` | `copy.go` | Copies files host→host or host→chroot, with `ignore_missing` and permissions. |
| `autologin-gui` | `autologin-gui.go` | Configures display-manager autologin for the live user. |
| `mksquashfs` | `mksquashfs.go` | Compresses the live root into `filesystem.squashfs`. |
| `xorriso` | `xorriso.go` | Generates the final hybrid ISO image. |

### `shell` — the disciplined heir of `oa_shell`

The command string is never passed through fragile quoting: the worker writes it to a temporary script file and runs it with bash. If `chroot: true`, the file is physically created inside `<live_root>/tmp` so the chrooted bash can see it at `/tmp/oa-shell-*.sh`; the host-side copy is cleaned up afterwards. This kills the escaping problems that plagued the old generated-script era.

### `script` — external scripts, injected on demand

Same execution model as `shell`, but the source is a file on the host (e.g. from the Brain assets). In chroot mode the script is temporarily injected into the chroot's `/tmp`, executed, then removed.

### `template` — declarative file generation

Receives `content`, a `vars` map and a `dest`; renders the Go template and writes the result with the requested permissions, joining the path under `live_root` when `chroot: true`. This is how GRUB/ISOLINUX menus and configuration files are produced without a single `cat <<EOF` in sight.

### `copy` — typed file copy

A native Go copy with explicit error handling: missing `src` can be tolerated (`ignore_missing`), permissions are applied, and the destination is resolved against the chroot when requested.

### `autologin-gui` — universal live autologin

Unlocks the live user (`passwd -d`, `usermod -U` in chroot), detects the preferred desktop session from `/usr/share/xsessions`, then applies the configuration to every display manager it finds (SDDM, LightDM, GDM — the pattern extends trivially to others).

### `mksquashfs` — the compression engine

Builds the `mksquashfs` invocation natively via `os/exec`: algorithm and level from the plan (default `zstd` level 3), 1M blocks, all available CPU cores, exclusion list from the planner. Parameter validation is fail-fast: missing `live_root` or `dest_file` aborts before touching the disk.

### `xorriso` — the final bake

Assembles the hybrid BIOS+UEFI ISO (`xorriso -as mkisofs`): El Torito boot with ISOLINUX, alternate EFI boot from `efi.img`, isohybrid MBR. Environment variables in `output_file`/`source_dir` are expanded, with safe fallbacks if unresolved.

---

## 🔁 The Round Trip

```
oa (C)                          coa ell (Go)
  │  fork + pipe (task JSON)        │
  ├────────────── STDIN ───────────▶│ dispatcher.RouteTask()
  │                                 ├──▶ worker.RunXxx(payload)
  │                                 │      (second, typed unmarshal)
  │◀──────────── exit code ─────────┤
  ▼
next task of the plan
```

One task, one worker process, one exit code. The output of every worker is teed by the C side into `/var/log/penguins-eggs.log`, so the whole flight — C and Go alike — lands in a single chronological log.
