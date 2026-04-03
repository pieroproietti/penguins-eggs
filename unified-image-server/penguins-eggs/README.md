# penguins-eggs / ChromiumOS support

ChromiumOS family integration for [penguins-eggs](https://github.com/pieroproietti/penguins-eggs),
the live-ISO remastering tool.

These files are drop-in replacements/additions for the `all-features` branch of
[Interested-Deving-1896/penguins-eggs](https://github.com/Interested-Deving-1896/penguins-eggs).

## Files

| File | Destination in penguins-eggs | Purpose |
|---|---|---|
| `src/classes/pacman.d/chromiumos.ts` | same path | Package manager backend for ChromiumOS family |
| `conf/derivatives_chromiumos.yaml` | same path | Derivative distro detection list |
| `conf/flavours/chromiumos.yaml` | same path | Browser flavour registry |

## Architecture support

The ChromiumOS family in penguins-eggs supports all four architectures that
the broader penguins-eggs project targets:

| Arch | EFI binary | Shim | initrd builder | Status |
|---|---|---|---|---|
| `amd64` (`x64`) | `bootx64.efi` | `shimx64.efi` | dracut | ✅ Supported |
| `arm64` | `bootaa64.efi` | `shimaa64.efi` | dracut | ✅ Supported |
| `i386` (`ia32`) | `bootia32.efi` | `shimia32.efi` | dracut | ✅ Supported |
| `riscv64` | `bootriscv64.efi` | none | dracut | ✅ Supported (no shim) |

**EFI boot**: Handled generically by `make-efi.ts` via `process.arch` — no
ChromiumOS-specific code needed. All four arches are covered.

**Package management**: `emerge` (Portage) and `crew` (Chromebrew) are both
arch-agnostic. No per-arch logic in `chromiumos.ts`.

**initrd**: ChromiumOS stage3 containers include `dracut`. The `initrdDracut`
builder (shared with Fedora/Gentoo/openSUSE) is the correct choice. This was
previously implicit (fallthrough); it is now explicit via `ChromiumOS.initrdBuilder()`.

**Kernel parameters** (from `diversions.ts`):
```
root=live:CDLABEL=<volid> rd.live.image rd.live.dir=/live
rd.live.squashimg=filesystem.squashfs cros_debug
```
The `cros_debug` flag is the only ChromiumOS-specific addition to the standard
dracut live boot parameter set.

**riscv64 note**: No shim is available for RISC-V. `make-efi.ts` handles this
by using GRUB directly as the boot EFI binary (`bootriscv64.efi`). Secure Boot
is not available on riscv64 ChromiumOS.

## What changed from the upstream all-features branch

### `chromiumos.ts`

- **Architecture documentation**: Added `initrdBuilder()` and `efiBootBinary()`
  static methods making the arch/initrd selection explicit and testable.
- **Stage3 awareness**: `hasPortage()` detects stage3 containers (from this
  project's `chromiumos-stage3` component) and prefers `emerge` over `crew`
  when a full Portage tree is present.
- **Board awareness**: `detectBoard()` reads `CHROMEOS_RELEASE_BOARD` from
  `/etc/lsb-release` and `/etc/chromiumos-stage3-board` to identify openFyde
  hardware boards (rpi4-openfyde, rock5b-openfyde, etc.).
- **`capabilities()`**: New diagnostic method returning the full environment
  summary (portage, chromebrew, gentooPrefix, crosSdk, board, variant).
- **`/var/db/pkg` search**: Extracted into `findInVarDbPkg()` private method,
  handles both full atoms (`category/name`) and bare names correctly.
- **Variant detection**: Extended to detect `chromiumos-stage3` variant and
  openFyde board-specific variants from `/etc/lsb-release`.

### `derivatives_chromiumos.yaml`

Added:
- `ChromiumOS-stage3` / `Chromiumos-stage3` — stage3 container environments
- All openFyde hardware board IDs (`rpi4-openfyde`, `rock5b-openfyde`, etc.)

### `conf/flavours/chromiumos.yaml`

- **Architecture-aware tarball filters**: `thorium` and `brave` now specify
  separate tarball patterns for `amd64` and `arm64`.
- **`openfyde` flavour**: New entry for openFyde boards where the browser is
  pre-installed via the board overlay.
- **Stage3 notes**: `vanadium` and `cromite` entries document that they are
  only viable inside stage3 containers with a full Portage tree.
- **`crew_package`**: Added crew fallback package name to `chromium` flavour
  for non-stage3 environments.

## ChromiumOS family tree

```
ChromiumOS (upstream)
├── ChromeOS (Google proprietary)
├── openFyde / FydeOS (Fyde Innovations)
│   ├── rpi4-openfyde   (Raspberry Pi 4B/400)
│   ├── rpi5-openfyde   (Raspberry Pi 5)
│   ├── rock5b-openfyde (ROCK 5B, RK3588S)
│   ├── rockpi4b-openfyde (Rock Pi 4B, RK3399)
│   ├── rock4cp-openfyde  (ROCK 4C+, RK3399)
│   ├── orangepi5-openfyde (Orange Pi 5/5B/5 Plus, RK3588S)
│   ├── firefly-rk3588spc-openfyde
│   ├── firefly-itx3588j-openfyde
│   └── arm64-openfyde_vmware (generic arm64 / Apple Silicon VMware)
├── ThoriumOS (compiler-optimized)
├── WayneOS
├── Brunch (generic x86 hardware)
└── ChromiumOS stage3 (build environments, from chromiumos-stage3/)
    ├── reven (amd64 generic)
    └── arm64-generic (arm64 generic)
```
