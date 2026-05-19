# oa-tools - AI Agents Guidelines

Welcome, AI Agent. If you are reading this file, you are assisting with the development of `oa-tools`, a high-performance Linux remastering and system installation suite created by Piero Proietti. 

Before generating any code, suggesting refactors, or altering the build logic, you MUST read and strictly adhere to the following architectural rules and constraints.

## 1. Project Architecture (The Brain and The Muscle)
The project is strictly divided into two distinct entities:
* **`oa` (The Muscle):** Written in C. It handles low-level system operations, filesystem mounts, chroot, and heavy lifting. Fast and memory-efficient.
* **`coa` (The Brain):** Written in Go (Golang). It is the orchestrator, CLI interface (via Cobra), and high-level manager that drives `oa`.

**Rule:** Never mix C system logic into the Go orchestrator, and never put high-level CLI routing into the C engine.

## 2. Universal Context (`pkg/context`)
The project relies on a single source of truth for environmental awareness: `sysctx.RuntimeContext` located in `coa/pkg/context`.
There are exactly four supported environments:
* `ci`: Ephemeral cloud runners (e.g., GitHub Actions Docker).
* `vagrant`: Virtual machines managed by Vagrant with `9p` shared folder mounts.
* `vm`: Standard virtual machines (KVM/QEMU) without shared mounts.
* `host`: Bare metal hardware (the developer's main machine).

**Rule:** NEVER use `os.Getenv`, `os.User`, or virtualization checks manually in random files. Always inject or pass `sysctx.RuntimeContext` to modules that need to know where they are running, where the source code is (`ctx.ProjRoot`, `ctx.CoaDir`), and where to build (`ctx.BaseBuildDir`).

## 3. The Vagrant / 9p Mount Constraint (CRITICAL)
When `ctx.EnvType == "vagrant"`, the project is running inside a VM with a shared host folder via the `9p` filesystem driver.
**Rule:** Under NO circumstances should the build system (`go build`, `make`, or Cobra doc generation) write artifacts directly to the repository folder while in `vagrant`. The `9p` driver will crash with `Permission denied` errors. All artifacts, binaries, and generated documents must be strictly routed to RAM (`/tmp/oa-build` -> `ctx.BaseBuildDir`).

## 4. Build and Packaging Lexicon (`pkg/builder`)
The build process is cleanly separated into compilation and packaging. Use the correct terminology:
* **The Forge (`build.go`):** Responsible ONLY for compiling the C engine, the Go orchestrator, and generating CLI docs. It outputs binaries to `ctx.BaseBuildDir`.
* **The Tailors (`pack_*.go`):** Responsible for taking the compiled binaries and crafting native Linux packages (e.g., `pack_arch.go` for `.pkg.tar.zst`, `pack_debian.go` for `.deb`).

**Rule:** When adding support for a new Linux distribution, create a new `pack_<distro>.go` file. Do not clutter `build.go` with distro-specific packaging logic.

## 5. Coding Style
* **Go:** Strictly idiomatic. Handle all errors explicitly. Use `fmt.Printf` with color codes for CLI outputs. Keep signatures clean (leverage structs like `RuntimeContext` instead of passing 6 different string parameters).
* **C:** POSIX-compliant, secure, and minimal. Always check return values for memory allocations and system calls.

## 6. Compression (mksquashfs)
Compression levels (`zstd`) are dynamic based on the environment to save CPU cycles or maximize density. Always read `ctx.ZstdLevel` when configuring squashfs operations.

---
*Failure to follow these guidelines will result in broken builds across CI and local Vagrant environments. Act as a senior systems engineer.*

## 7. Legacy Code (DO NOT READ)
The `legacy/` directory contains old experiments and deprecated scripts (e.g., Python, Ruby). 
**Rule:** You MUST completely ignore the `legacy/` directory. Do not read its contents, and do not suggest using any code from it. The project is strictly C and Go.