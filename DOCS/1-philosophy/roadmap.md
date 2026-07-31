# Roadmap & Open Points

> Working notes, last reviewed June 2026. These items come from development sessions and are not yet scheduled.

## Current Status

- ✅ Remastering working on all six families: Alpine, Arch, Debian, Fedora, Manjaro, openSUSE (and derivatives).
- ✅ Graphical installer: Calamares (Alpine included).
- ✅ TUI installer: Krill, rewritten in Go with Bubbletea — supports full installation on both **ext4** and **btrfs** filesystems, verified in VM on both BIOS and UEFI. Features an interactive wizard plus `--unattended` mode for headless installs. See [installer.md](../3-developer-manual/architecture/installer.md) for the implemented architecture.
- ✅ Bootloader support: GRUB, systemd-boot, and Limine (UEFI & BIOS).
- ✅ Clone with user data (`--clone`).
- ✅ Encrypted clone (`--crypted`).
- ✅  Krill — TUI system intaller, a perfect analogue to a TUI calamares!

### 2. Hardcoded work_dir in the templates
`/home/eggs` appears literally in the shell commands of `base.yaml.tmpl`. If the user changes `settings.remaster.work_dir`, the shell commands do not respect it. Solution: pass it as a template variable inside the shell commands too:

```yaml
command: "/etc/penguins-eggs.d/scripts/copy-kernel-initrd.sh {{ .settings.remaster.work_dir }}"
```

### 3. generate-efi.img as a dedicated module
The inline step with `dd` + `mkfs.vfat` + `mmd` + `mcopy` is fragile. Candidate for a dedicated `efi_image` module with structured error handling.

### 4. Cleanup/rollback on error
The `cleanup` step is commented out in the YAML. If the pipeline fails midway, mounts are left hanging. Evaluate an automatic rollback mechanism in `coa`.

## Test Hardware

| Arch | Hardware | Notes |
|---|---|---|
| amd64 | Main Proxmox host | CI VMs, self-hosted runner |
| arm64 | Raspberry Pi 5 with Proxmox | ARM64 VMs, already operational |
| riscv64 | SpaceMit MuseBook M1 | Bianbu OS (Ubuntu derivative), already remastered with eggs |

## Visibility / Community

- Problem: the new C/Go repo has few stars despite its quality — the legacy penguins-eggs repo still captures all the traffic.
- Plan: wait for Debian/Ubuntu feature parity, then a technical blog post + HackerNews ("I rewrote my remastering tool in C+Go, here's why").
- The legacy penguins-eggs README already mentions this new C/Go version as the successor — strengthen that link.
