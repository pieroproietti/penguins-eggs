# os-hardening

Applies [Opsek/OSs-security](https://github.com/Opsek/OSs-security) hardening scripts
to eggs-produced system chroots. Audited by Sigma Prime.

## Usage

```bash
# Apply hardening during produce
eggs produce --harden

# Standalone hardening of a mounted chroot
eggs harden --target /mnt/chroot

# Simulate without making changes
eggs harden --dry-run --target /mnt/chroot

# Download upstream scripts
eggs audit setup --os linux
```

## Supported OS targets

- `linux` — Debian/Ubuntu/Arch hardening + factory reset guide
- `macos` — macOS hardening + factory reset guide
- `windows` — Windows hardening + factory reset guide (PowerShell)

## Dependencies

- `bash` (Linux/macOS) or `pwsh` (Windows)
- Upstream scripts fetched via `eggs audit setup`
