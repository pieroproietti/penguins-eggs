# ⚙️ CI Architecture: Hammers & Furnace

The CI of **penguins-eggs (oa edition)** is split into two pipelines with complementary jobs, both living in `.github/workflows/`:

| Pipeline | Workflow | Where it runs | What it produces |
| :--- | :--- | :--- | :--- |
| 🔨 **Hammers** | `hammers.yml` | GitHub-hosted runners (containers) | Native packages (`.deb`, `.apk`, `.pkg.tar.zst`, `.rpm`) |
| 🏭 **Furnace** | `furnace.yml` | Self-hosted runner + Proxmox VE | Bootable ISO images via `coa remaster` |

The split follows a simple observation: **packaging** is user-space work and runs happily inside GitHub's containers, while **remastering** needs a real kernel, real mounts and real root — things a hardened CI container cannot provide. Trying to fake the full remaster flow on GitHub runners only produces "CI theater": artificial bypass logic that adds zero value. The quality of system software is tested on the road, not in a test tube.

---

## 🔨 Hammers: the Packaging Matrix

Runs on every push and pull request to `main` (plus manual dispatch). A `fail-fast: false` matrix spins up one container per target distribution:

| Distro | Image | Package |
| :--- | :--- | :--- |
| Alpine | `alpine:latest` | `.apk` (via `abuild`) |
| Arch | `archlinux:latest` | `.pkg.tar.zst` |
| Manjaro | `manjarolinux/base:latest` | `.pkg.tar.zst` |
| Debian | `debian:bookworm` | `.deb` |
| Fedora | `fedora:latest` | `.rpm` |
| openSUSE | `opensuse/tumbleweed` | `.rpm` |

Each leg of the matrix performs the same ritual:

1. **Workshop setup:** installs the native toolchain (GCC, Go, make, the distro's packaging tools) and creates the unprivileged `artisan` user.
2. **Checkout & build:** full-history checkout (tags included, used for versioning), then `make` compiles both `oa` (C) and `coa` (Go).
3. **Native packaging:** `make package` runs as `artisan` and drives the distro-specific packager (`abuild`, `makepkg`-style, `dpkg`, `rpmbuild`).
4. **Live install test:** the freshly built package is installed on the running container — a real smoke test of the package metadata and file layout.
5. **Artifact upload:** the package is published as a GitHub artifact (`penguins-eggs-<distro>`, 7-day retention).

Hammers therefore answers the question: *does the codebase compile and package cleanly on every supported family?*

---

## 🏭 Furnace: Remastering on Real Iron

Triggered manually (`workflow_dispatch`), Furnace runs on a **self-hosted runner** that orchestrates the Proxmox VE host (**father**). Each matrix entry maps a distribution to a dedicated KVM virtual machine with a pristine snapshot:

| Distro | VMID | Snapshot |
| :--- | :--- | :--- |
| Alpine | 301 | `virgin` |
| Arch | 302 | `virgin` |
| Debian | 303 | `virgin` |
| Fedora | 304 | `virgin` |

> **Why only these four?** CLI editions of Manjaro are hard to source, and openSUSE support is currently lagging behind. The Furnace matrix will grow as those gaps close.

The flight plan of each job:

1. **Secrets (air-gapped):** credentials are sourced from `/etc/p4/secrets.env` on the runner itself — never stored on GitHub — and masked in the logs with `::add-mask::`.
2. **Rollback & boot:** the VM is rolled back to its `virgin` snapshot and started (`qm rollback` + `qm start` on father). Every run begins from an identical, uncontaminated system.
3. **Dynamic IP discovery:** the VM's MAC address is read live from `qm config`, then a fast ARP sweep over the local subnet locates the assigned IP — no static leases required.
4. **Wait for SSH:** the job polls until the guest's SSH daemon answers.
5. **Install & remaster:** the latest released package for that distro is downloaded from GitHub Releases, installed natively, then `sudo coa remaster` bakes the ISO on a real kernel with real mounts.
6. **Export:** the resulting ISO is shipped to the Proxmox storage (`export iso --clean`, which also prunes older versions on the server).
7. **Shutdown:** the VM is powered off (`if: always()`), leaving the hypervisor clean even on failure.

Furnace therefore answers the question: *does the full remastering chain actually produce a bootable ISO on every supported family?*

For the host/guest configuration behind this setup (VirtFS, QEMU Guest Agent, snapshots), see [proxmox.md](./proxmox.md). The older local lab based on Vagrant is documented in [vagrant.md](./vagrant.md).
