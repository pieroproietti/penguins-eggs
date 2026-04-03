# manifests

Distrobuilder YAML manifests and wrapper scripts for building Incus/LXD/LXC
container and VM images.

## Distrobuilder manifests

| File | Distro | Arches | Container | VM | Init |
|---|---|---|---|---|---|
| `ubuntu.yml` | Ubuntu (noble, jammy) | amd64, arm64 | ✅ | ✅ | systemd |
| `debian.yml` | Debian (bookworm, trixie) | amd64, arm64, i386 | ✅ | ✅ | systemd |
| `devuan.yml` | Devuan (daedalus, excalibur) | amd64, arm64 | ✅ | — | sysvinit/OpenRC |
| `alpine.yml` | Alpine Linux (edge) | amd64, arm64 | ✅ | — | OpenRC |
| `archlinux.yml` | Arch Linux (current) | amd64, arm64 | ✅ | — | systemd |
| `fedora.yml` | Fedora (41) | amd64, arm64 | ✅ | ✅ | systemd |
| `almalinux.yml` | AlmaLinux (9) | amd64, arm64 | ✅ | ✅ | systemd |
| `rockylinux.yml` | Rocky Linux (9) | amd64, arm64 | ✅ | ✅ | systemd |
| `opensuse.yml` | openSUSE Tumbleweed | amd64, arm64 | ✅ | ✅ | systemd |
| `gentoo/ctr-openrc.yaml` | Gentoo | amd64 | ✅ | — | OpenRC |
| `gentoo/ctr-systemd.yaml` | Gentoo | amd64 | ✅ | — | systemd |
| `gentoo/vm-openrc.yaml` | Gentoo | amd64 | — | ✅ | OpenRC |
| `gentoo/vm-systemd.yaml` | Gentoo | amd64 | — | ✅ | systemd |

## Wrapper scripts

| Script | Distro | Arches | Type |
|---|---|---|---|
| `bin/build-talos-image.sh` | Talos Linux | amd64, arm64 | VM only |
| `bin/build-chromiumos-image.sh` | ChromiumOS (build env) | amd64, arm64 | Container |

Wrapper scripts download pre-built upstream artifacts and repackage them as
Incus unified tarballs (rootfs.tar.xz + metadata.tar.xz). They do not use
Distrobuilder.

## Building images

### Distrobuilder manifests

```bash
# Install distrobuilder
go install github.com/lxc/distrobuilder/distrobuilder@latest

# Build a container image
sudo distrobuilder build-incus ubuntu.yml --type unified

# Build for a specific release and arch
sudo distrobuilder build-incus debian.yml \
  -o image.release=trixie \
  -o image.architecture=arm64 \
  --type unified

# Build a VM image
sudo distrobuilder build-incus ubuntu.yml \
  -o image.variant=cloud \
  --vm --type unified

# Gentoo (OpenRC container)
sudo distrobuilder build-incus gentoo/ctr-openrc.yaml --type unified

# Gentoo (systemd container)
sudo distrobuilder build-incus gentoo/ctr-systemd.yaml --type unified
```

### Wrapper scripts

```bash
# Talos Linux VM image (amd64)
sudo ./bin/build-talos-image.sh

# Talos Linux VM image (arm64)
sudo ./bin/build-talos-image.sh --arch arm64 --version v1.7.6

# ChromiumOS build-environment container (amd64, from sebanc releases)
./bin/build-chromiumos-image.sh

# ChromiumOS build-environment container (arm64, from local stage3 build)
./bin/build-chromiumos-image.sh \
  --board arm64-generic \
  --repo file:///path/to/chromiumos-stage3/output
```

## Adding a new distro

1. Check if Distrobuilder has a downloader for it:
   `distrobuilder list-downloaders`
2. Create `<distro>.yml` following the pattern of an existing manifest with
   the same package manager
3. Test: `sudo distrobuilder build-incus <distro>.yml --type unified`
