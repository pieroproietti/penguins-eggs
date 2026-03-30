# Adding a New Distro

A distro profile is a TOML file in `distros/<id>.toml` that declares which
backends are compatible and provides package manager commands.

## Minimum profile

```toml
[distro]
id           = "mylinux"
family       = "debian"          # arch | debian | fedora | alpine | gentoo | opensuse | void
pkg_manager  = "apt"
pkg_add      = "apt install -y"
pkg_remove   = "apt remove -y"
pkg_update   = "apt update && apt upgrade -y"
bootstrap    = "debootstrap"

architectures = ["x86_64", "aarch64"]

backends = ["ashos", "akshara"]

[backends.ashos]
requires_fs = "btrfs"
notes       = "Bootstrap from the mylinux live ISO."

[backends.akshara]
requires_fs = "btrfs"
notes       = "system.yaml must reference a mylinux-based container image."

[bootloader]
supported = ["grub"]
default   = "grub"
grub_pkg  = "grub-efi-amd64"
efi_pkg   = "efibootmgr"
```

## Fields

| Field | Required | Description |
|---|:---:|---|
| `distro.id` | ✅ | Unique identifier; matches `[pif].distro` in `pif.toml` |
| `distro.family` | ✅ | Parent distro family for package manager detection |
| `distro.pkg_manager` | ✅ | Package manager binary name |
| `distro.pkg_add` | ✅ | Command to install packages |
| `distro.pkg_remove` | ✅ | Command to remove packages |
| `distro.pkg_update` | ✅ | Command to upgrade all packages |
| `distro.bootstrap` | ✅ | Tool used to bootstrap a root from scratch |
| `distro.architectures` | ✅ | List of tested architectures |
| `backends` | ✅ | List of compatible backend names |
| `backends.<name>.requires_fs` | ✅ | Filesystem required by this backend on this distro |
| `backends.<name>.notes` | | Human-readable notes for distro builders |
| `bootloader.supported` | ✅ | List of supported bootloaders |
| `bootloader.default` | ✅ | Default bootloader |
| `bootloader.grub_pkg` | | Package name for GRUB on this distro |
| `bootloader.efi_pkg` | | Package name for EFI boot manager |

## Steps

1. Create `distros/<id>.toml`.
2. Add the distro to the table in `docs/distro-matrix.md`.
3. If the distro uses a non-systemd init system, add an `[init]` section and
   document the service file replacements needed.
4. Test with at least one backend in a VM before marking as ✅.
