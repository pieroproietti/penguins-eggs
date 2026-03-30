# Backend Reference

Each backend is an adapter that wraps an upstream immutability project and
exposes it through the PIF HAL. Backends live in `backends/<name>/adapter.go`.

---

## abroot

**Origin:** [Vanilla-OS/ABRoot](https://github.com/Vanilla-OS/ABRoot)  
**Language:** Go  
**License:** GPL-3.0

### Mechanism

Maintains two root partitions (A and B). The active partition is `current`;
the inactive one is `future`. On upgrade, ABRoot pulls an OCI image from a
registry, applies it to the future partition, and switches roles on next boot.
Updates are atomic: if the future partition fails to boot, the system stays on
the current partition.

### Capabilities

`rollback`, `atomic-pkg`, `oci-images`, `mutable`, `thin-provision`

### When to use

- Appliance or desktop distros that ship as OCI images
- Environments where A/B partition switching is acceptable
- Vanilla OS derivatives

### Partition layout required

```
vos-efi   EFI System Partition
vos-boot  Master boot (GRUB config selector)
vos-a     Root A
vos-b     Root B
vos-var   Persistent /var
```

---

## ashos

**Origin:** [ashos/ashos](https://github.com/ashos/ashos)  
**Language:** Python  
**License:** AGPL-3.0

### Mechanism

Wraps any bootstrappable Linux distro in an immutable BTRFS snapshot tree.
Snapshots are organised hierarchically (parent → child). The `ash` CLI manages
snapshot creation, deployment, package installation (via the native package
manager inside a chroot), and rollback.

### Capabilities

`snapshot`, `rollback`, `atomic-pkg`, `mutable`, `multi-boot`

### When to use

- Multi-distro environments (Arch, Debian, Fedora, Alpine, Gentoo, etc.)
- Hierarchical snapshot trees (e.g. base → gnome → gaming)
- Distros that do not ship as OCI images
- Embedded or server systems needing minimal overhead

### Filesystem required

BTRFS with subvolume layout:
```
/@          root subvolume (snapshot tree root)
/@home      persistent home
/@var       persistent var
```

---

## frzr

**Origin:** [ChimeraOS/frzr](https://github.com/ChimeraOS/frzr)  
**Language:** Shell  
**License:** MIT

### Mechanism

Deploys pre-built OS images as read-only BTRFS subvolumes. Images are
distributed as GitHub release tarballs. On boot, `frzr-deploy` downloads the
latest image, extracts it to a new subvolume, and sets it as the next boot
target. `/home` and `/var` are separate persistent subvolumes.

### Capabilities

`rollback`, `oci-images`

### When to use

- Gaming or appliance distros with infrequent, image-based updates
- Environments where the entire OS is rebuilt and shipped as a tarball
- ChimeraOS derivatives

### Notes

- No per-package atomic installs; the entire image is replaced on upgrade.
- `MutableEnter()` is not supported; use `core/mutable` overlay fallback.

---

## akshara

**Origin:** [blend-os/akshara](https://github.com/blend-os/akshara)  
**Language:** Python  
**License:** GPL-3.0

### Mechanism

Declarative system builder. A `system.yaml` file describes the desired OS
state: base container image, packages, and overlays. On upgrade, akshara
rebuilds the system image from the declaration and applies it. This makes the
system reproducible from the YAML file alone.

### Capabilities

`snapshot`, `rollback`, `atomic-pkg`, `mutable`

### When to use

- Declarative, reproducible distros
- Container-native environments (blendOS derivatives)
- Distros where the system state should be fully described in a single file

### system.yaml example

```yaml
track: https://pkg-repo.blendos.co
packages:
  - base
  - linux
  - linux-firmware
  - networkmanager
```

---

## btrfs-dwarfs

**Origin:** [btrfs-dwarfs-framework](https://github.com/Interested-Deving-1896/btrfs-dwarfs-framework)  
**Language:** C (kernel module) + C (userspace daemon/CLI)  
**License:** see upstream

### Mechanism

Hybrid filesystem: a writable BTRFS upper layer blended with one or more
compressed read-only DwarFS lower layers. Reads fall through from BTRFS to
DwarFS; writes always land on BTRFS with automatic copy-up. DwarFS achieves
10–16× compression via similarity hashing.

The `bdfs` CLI manages partitions, exports/imports, snapshots, and the blend
namespace. A kernel module (`btrfs_dwarfs.ko`) provides the VFS integration.

### Capabilities

`snapshot`, `rollback`, `mutable`, `compression`

### When to use

- Storage-constrained systems (embedded, IoT, low-cost hardware)
- Distros where the read-only base needs maximum compression
- Environments that need BTRFS CoW semantics on top of compressed images

### Requirements

- Linux kernel ≥ 5.15
- `btrfs_dwarfs.ko` kernel module loaded
- `bdfs_daemon` running
- DwarFS userspace tools (`mkdwarfs`, `dwarfs`, `dwarfsextract`, `dwarfsck`)

---

## Capability Matrix

| Capability | abroot | ashos | frzr | akshara | btrfs-dwarfs |
|---|:---:|:---:|:---:|:---:|:---:|
| snapshot | | ✅ | | ✅ | ✅ |
| rollback | ✅ | ✅ | ✅ | ✅ | ✅ |
| atomic-pkg | ✅ | ✅ | | ✅ | |
| oci-images | ✅ | | ✅ | | |
| mutable | ✅ | ✅ | | ✅ | ✅ |
| compression | | | | | ✅ |
| multi-boot | | ✅ | | | |
| thin-provision | ✅ | | | | |
