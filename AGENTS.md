# AGENTS.md – oa-tools

> **For AI Agent:** You are assisting with the development of `oa-tools` by Piero Proietti. Read and obey these rules before generating code or suggesting changes.

---

## 0. Project Context (READ FIRST)

**Lineage:** `oa-tools` is the direct, high-performance successor to **penguins-eggs** (500⭐, production-ready TypeScript tool). This is the future architecture.

**Purpose:** Professional suite to remaster running Linux systems, create bootable Live ISOs, and manage system installations across multiple distributions.

**Status:** Heavy, active development. Not yet production-ready.

**Required domain knowledge:** Linux filesystems, `chroot`, `squashfs` (zstd), `overlayfs`, Live-boot mechanisms, native packaging (`dpkg-deb`, `makepkg`).

---

## 0.1 Relationship with penguins-eggs

| Aspect | penguins-eggs | oa-tools |
|--------|---------------|----------|
| Language | TypeScript (Node.js) | **C + Go** |
| Architecture | Monolithic | Split: oa (C) + coa (Go) |
| Dependencies | npm packages | `oa` = **zero dependencies** |
| Maturity | ✅ Production-ready (500⭐) | ⚠️ Active dev (8⭐) |

**Rule:** If user wants stable production tool → suggest `penguins-eggs`. If they want to experiment/contribute → point to `oa-tools`.

---


## 1. Project Architecture (The Brain and The Muscle)

**NEVER** mix C system logic into Go. **NEVER** put CLI routing into C.

| Component | Language | Location | Role |
|-----------|----------|----------|------|
| **`oa` (The Muscle)** | C | `/oa` | Low-level: mounts, chroot, squashfs, users. Zero dependencies. |
| **`coa` (The Brain)** | Go | `/coa` | Orchestrator, CLI (Cobra), drives `oa`. |

---

## 2. Universal Context (`sysctx.RuntimeContext`) – CRITICAL

Source of truth for environment awareness. Located in `coa/pkg/context`.

**Four supported environments:**

| Env | Description |
|-----|-------------|
| `ci` | Ephemeral cloud runners (GitHub Actions Docker) |
| `vm` | Standard VMs (KVM/QEMU) without shared mounts |
| `host` | Bare metal (developer machine) |

**Rule:** **NEVER** use `os.Getenv`, `os.User`, or manual virtualization checks. Always inject `sysctx.RuntimeContext`. Use `ctx.ProjRoot`, `ctx.CoaDir`, `ctx.BaseBuildDir`.

---


## 4. Build and Packaging Lexicon (`pkg/builder`)

| Component | Responsibility | Location |
|-----------|----------------|----------|
| **The Forge (`build.go`)** | Compiles C engine, Go orchestrator, generates CLI docs → outputs to `ctx.BaseBuildDir` | `coa/cmd/forge/` |
| **The Tailors (`pack_*.go`)** | Crafts native packages (.deb, .pkg.tar.zst, .rpm) from compiled binaries | `coa/pkg/builder/` |

**Rule:** New distribution = new `pack_<distro>.go`. Do **NOT** clutter `build.go` with packaging logic.

---

## 5. Compression (`mksquashfs`)

Compression levels (`zstd`) are dynamic. **ALWAYS** read `ctx.ZstdLevel` when configuring squashfs operations.

---

## 6. Coding Style

| Language | Rules |
|----------|-------|
| **Go** | Idiomatic. Explicit error handling. Use colored `fmt.Printf` for CLI. Keep signatures clean (pass structs like `RuntimeContext`, not 6 strings). |
| **C** | POSIX-compliant, secure, minimal. **ALWAYS** check return values of malloc and syscalls. |

---

## 7. Common Pitfalls for AI Agents (DO NOT DO)

**NEVER:**

1. Add dependencies to `oa` – must stay **zero-dependency**
2. Hardcode paths – always use `ctx.*` variables
4. Mix C and Go logic – cross the streams = broken build
5. Suggest removing C – performance gain is non-negotiable

**ALWAYS:**

- Check `ctx.EnvType` before filesystem-heavy ops
- Add new packers in `coa/pkg/builder/pack_*.go`

---

*Failure to follow these guidelines will break builds across CI and local Vagrant environments. Act as a senior systems engineer.*
