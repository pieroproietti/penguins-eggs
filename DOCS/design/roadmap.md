# Roadmap & Open Points

> Working notes, last reviewed June 2026. These items come from development sessions and are not yet scheduled.

## Current Status

- ✅ Remastering working on all six families: Alpine, Arch, Debian, Fedora, Manjaro, openSUSE (and derivatives).
- ✅ Graphical installer: Calamares (Alpine included).
- ✅ TUI installer: Krill (see open point 1).
- ❌ Clone with user data (`--mode clone`).
- ❌ Encrypted clone (`--mode crypted`).

## Open Points

### 1. Krill — TUI installer
- In penguins-eggs it was written in TypeScript; it must be rewritten in Go.
- Candidate library: **Bubbletea** (charmbracelet) for the multi-step wizard.
- Priority target: **server sysadmins** (headless, no Calamares).
- The installation logic already lives in the `install:` block of the YAML profile — Krill can be a TUI frontend that collects parameters and then executes the same plan.
- Full design: [installer.md](./installer.md).

### 2. Multi-architecture detection
The `Arch` field in `distro` uses `runtime.GOARCH`; it should use `uname -m` before the multi-arch porting:

```go
func detectArch() string {
    out, err := exec.Command("uname", "-m").Output()
    if err != nil {
        return runtime.GOARCH // fallback
    }
    arch := strings.TrimSpace(string(out))
    switch arch {
    case "x86_64":  return "amd64"
    case "aarch64": return "arm64"
    case "riscv64": return "riscv64"
    default:        return arch
    }
}
```
To be integrated in `NewDistro()` before the arm64/riscv64 ports.

### 3. Hardcoded work_dir in the templates
`/home/eggs` appears literally in the shell commands of `base.yaml.tmpl`. If the user changes `settings.remaster.work_dir`, the shell commands do not respect it. Solution: pass it as a template variable inside the shell commands too:

```yaml
command: "/etc/oa-tools.d/scripts/copy-kernel-initrd.sh {{ .settings.remaster.work_dir }}"
```

### 4. generate-efi.img as a dedicated module
The inline step with `dd` + `mkfs.vfat` + `mmd` + `mcopy` is fragile. Candidate for a dedicated `efi_image` module with structured error handling.

### 5. Cleanup/rollback on error
The `cleanup` step is commented out in the YAML. If the pipeline fails midway, mounts are left hanging. Evaluate an automatic rollback mechanism in `coa`.

## Test Hardware

| Arch | Hardware | Notes |
|---|---|---|
| amd64 | Main Proxmox host | CI VMs, self-hosted runner |
| arm64 | Raspberry Pi 5 with Proxmox | ARM64 VMs, already operational |
| riscv64 | SpaceMit MuseBook M1 | Bianbu OS (Ubuntu derivative), already remastered with eggs |

## Visibility / Community

- Problem: oa-tools has few stars despite its quality — penguins-eggs still captures all the traffic.
- Plan: wait for Debian/Ubuntu feature parity, then a technical blog post + HackerNews ("I rewrote my remastering tool in C+Go, here's why").
- The penguins-eggs README already mentions oa-tools as the successor — strengthen that link.
