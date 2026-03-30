## Summary

Merges [lkf](https://github.com/Interested-Deving-1896/lkf) (Linux Kernel Framework — shell build pipeline) and [ukm](https://github.com/Interested-Deving-1896/ukm) (Universal Kernel Manager — Python runtime management) into a single Python package, `lkm`, covering the full kernel lifecycle: **build → install → manage**.

---

## What changed

### A — lkf → ukm handoff
- `lkm/core/providers/lkf_build.py`: discovers `remix.toml` profiles from the lkf installation, drives `lkf remix` / `lkf build` as a subprocess with live streaming output, locates the output package by extension, and installs it via the system backend.
- `lkm/core/providers/local_file.py`: installs pre-built `.deb`/`.rpm`/`.pkg.tar.zst`/`.apk`/`.xbps` files dropped in by the user or produced by lkf.

The full CLI pipeline:
```sh
penguins-kernel-manager build --version 6.12 --flavor tkg --llvm --lto thin --install
lkm remix --file ~/.local/share/lkf/profiles/gaming.toml --install
```

### B — New backends (distro/arch agnosticism)
| Backend | Distro | Notes |
|---|---|---|
| `xbps.py` | Void Linux | install/remove via `xbps-install`/`xbps-remove`; hold/unhold via `xbps-pkgdb -m hold/unhold`; local `.xbps` via `-R <repodir>` |
| `nix.py` | NixOS | emits `boot.kernelPackages` snippets + optional `nixos-rebuild switch`; hold/unhold explains declarative pinning |

`system.py` extended: `VOID`/`NIXOS` added to `DistroFamily` and `PackageManagerKind`; `in_nix_shell` field added to `SystemInfo`.

### C — Unified project
- Single `pyproject.toml` with `penguins-kernel-manager` (CLI) and `penguins-kernel-manager-gui` (Qt GUI) entry points.
- `KernelFamily` gains `LKF_BUILD` for locally compiled kernels.
- `KernelManager` gains `lkf_provider`, `install_local()`, and `nixos_build_warning()`.
- `providers/__init__.py` selects family-specific providers (Gentoo, Void, NixOS) at runtime.

### D — GUI Build tab
`lkm/gui/widgets/lkf_build_dialog.py` — two modes:
- **Profile**: pick a `remix.toml` from discovered profiles (or browse), run `lkf remix`, stream output live.
- **Custom**: version + flavor + arch + LLVM/LTO/output-format fields, run `lkf build`.

A `_BuildWorker(QThread)` streams output into the shared `LogPanel`. On success, `build_succeeded(pkg_path)` is emitted; the main window offers to install the result. The toolbar **Build…** button is disabled with a tooltip when lkf is not on PATH.

---

## Tests

97 tests, all passing:

| Suite | Coverage |
|---|---|
| `test_kernel_version.py` | `KernelVersion` parse, comparison, sort, hash |
| `test_system_detection.py` | distro family detection for 10 distros, arch normalisation (9 mappings), PM detection (8 binaries + family fallback) |
| `test_backends.py` | `XbpsBackend` (13 cases), `NixBackend` (11 cases) |
| `test_lkf_bridge.py` | profile parsing, output package discovery, availability, listing, streaming, error handling, full build+install pipeline |
| `test_local_file_provider.py` | version extraction from 4 package formats, install delegation, error cases |

---

## Known limitations

- **NixOS install** runs `nixos-rebuild switch` but does not edit `configuration.nix`. A full implementation requires knowing whether the user is on channels or flakes.
- **lkf root detection** falls back to `lkf info --json`, which requires lkf ≥ 0.1.0. Older installs still work via `LKF_ROOT` env var or standard path detection.
- `lkm/build/` is scaffolded but empty — reserved for vendoring lkf's shell scripts if desired.

---

## Distro coverage (against fresh-eggs support matrix)

All package manager backends from ukm are retained. The two new backends close the remaining gaps:

| Added | Distro | Package manager |
|---|---|---|
| ✅ | Void Linux | xbps |
| ✅ | NixOS | nix / nixos-rebuild |

Unsupported distros (Slackware, Mandrake-based, non-Linux) remain out of scope.
