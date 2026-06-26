# 🦾 The C Arm: `oa`

If `coa` is the mind that designs the "flight plan" by analyzing the YAML files, the **`oa`** binary is the arm that executes it. It is deliberately tiny — a few hundred lines of C plus the vendored `cJSON` parser — and deliberately blind: it knows nothing about distributions, YAML or templates. It receives `oa-plan.json`, walks it step by step and, depending on the `module` of each task, either executes it natively in C or delegates it to the Go worker (`coa ell`).

---

## 📥 Input and Invocation (`main.c`)

`oa` accepts the plan in two ways:

```bash
oa oa-plan.json          # from file
cat oa-plan.json | oa    # from STDIN (pipe)
```

Plus one emergency handle:

```bash
oa cleanup [work_dir]    # emergency unmount (default: /home/eggs)
```

`cleanup` builds a synthetic `umount` task on the fly and dispatches it — useful to free a workspace whose mounts were left behind by an interrupted run.

The plan must contain a top-level `plan` array of tasks. Each task carries at least a `name`, a `module` and its `params`:

```json
{
  "plan": [
    { "name": "Inject live identity", "module": "users",    "live_root": "...", "params": { ... } },
    { "name": "Build SquashFS",       "module": "squashfs", "params": { ... } },
    { "name": "Final cleanup",        "module": "umount",   "work_dir": "/home/eggs", "params": {} }
  ]
}
```

`oa` iterates over the array task by task, logging every step to `/var/log/penguins-eggs.log`. A failing task is recorded but does **not** abort the run: the loop continues, and the final exit code is non-zero if at least one task failed (the log reports the success/error count).

---

## 🔀 The Dispatcher (`engine.c`)

The whole routing logic fits in one function:

```c
int is_native_module(const char *module) {
    if (strcmp(module, "users") == 0 ||
        strcmp(module, "umount") == 0) {
        return 1;            // executed in C
    }
    return 0;                // everything else goes to Go
}
```

* **Native module** (`users`, `umount`) → `run_native()` handles it in-process with direct syscalls.
* **Any other module** → `run_go_worker()` delegates it to the Go craftsman.

The delegation is a clean Master-Worker handover, with no script generation involved: `oa` forks, pipes the *single task* as unformatted JSON into the child's STDIN, and the child executes `coa ell` (its combined output is teed into the shared log file). The parent waits for the worker and converts its exit status into the task result. One task, one worker process, one exit code — fail-fast and fully traceable.

---

## ⚙️ Native Modules (`native.c`)

Only the operations that genuinely need root close to the metal live in C:

### `users` — Purge & Inject

Identity management for the live system, operating directly on `<live_root>/etc/passwd`, `shadow` and `group`:

1. **Purge:** unless the mode is `clone` or `crypted`, all *human* users of the host (UID 1000–59999, thresholds borrowed from OpenEmbedded-Core) are stripped from the three databases.
2. **Inject:** the live users declared in `params.users` are appended natively — passwd entry, SHA-512 crypted password (via `crypt()`, plaintext passwords are hashed on the fly), primary group, secondary groups, home directory populated from `/etc/skel` and chowned.

The low-level read/write/filter primitives live in `oa-yocto.c`, a micro-library for passwd/shadow/group manipulation that keeps `oa` free of external dependencies.

### `umount` — the Safe Descent

Tears down the workspace mounts in strict order using the `umount2()` syscall with `MNT_DETACH` (lazy unmount), so the host never hangs on a busy mount:

1. API filesystems in `liveroot` (`dev/pts`, `dev`, `proc`, `sys`, `run`, `tmp`)
2. Overlay mounts (`usr`, `var`)
3. Standard bind mounts (`opt`, `root`, `srv`)
4. The overlay `lowerdir`s inside `.overlay`
5. Finally, `liveroot` itself

This is the same routine behind `coa destroy` and the `oa cleanup` emergency handle.

---

## 🧬 Anatomy

| File | Role |
| :--- | :--- |
| `src/main.c` | CLI entry point: reads the plan (file or STDIN), parses it with `cJSON`, drives the task loop. |
| `src/engine.c` | The dispatcher: routes each task to C (`run_native`) or to the Go worker (`coa ell` via fork + pipe). |
| `src/native.c` | The native modules: `users` (Purge & Inject) and `umount` (lazy teardown). |
| `src/oa-yocto.c` | Micro-library for passwd/shadow/group handling (OE-Core UID classification). |
| `src/logger.c` | Minimal file logger (`/var/log/penguins-eggs.log`). |
| `src/cJSON.c` | Vendored JSON parser — the only third-party code. |

The philosophy is the one described in [philosophy.md](../design/philosophy.md): `oa` is the site foreman — blind to the overall plan, infallible at its specific task. Everything high-level (SquashFS, ISO generation, bootloaders) belongs to the Go modules executed through `coa ell` — see [ell.md](./ell.md).
