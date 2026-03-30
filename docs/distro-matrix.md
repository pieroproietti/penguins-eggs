# Distro × Backend Matrix

Each cell shows whether the combination is supported (✅), untested (⚠️),
or not applicable (—). "Native" means the backend originated from that distro.

| Distro | abroot | ashos | frzr | akshara | btrfs-dwarfs |
|---|:---:|:---:|:---:|:---:|:---:|
| **Arch Linux** | — | ✅ | ✅ | ✅ | ✅ |
| **CachyOS** | — | ✅ | ✅ | ✅ | ✅ |
| **EndeavourOS** | — | ✅ | ✅ | ✅ | ✅ |
| **Manjaro** | — | ✅ | ⚠️ | ✅ | ⚠️ |
| **Debian** | ✅ | ✅ | — | ✅ | ⚠️ |
| **Ubuntu** | ✅ | ✅ | — | ✅ | ⚠️ |
| **Linux Mint** | ✅ | ✅ | — | ✅ | — |
| **Fedora** | — | ✅ | — | ✅ | ⚠️ |
| **RHEL / AlmaLinux / Rocky** | — | ✅ | — | ✅ | — |
| **Alpine Linux** | — | ✅ | — | ✅ | ⚠️ |
| **Gentoo** | — | ✅ | — | ⚠️ | ⚠️ |
| **openSUSE Tumbleweed** | — | ✅ | — | ✅ | ⚠️ |
| **openSUSE MicroOS** | — | ✅ | — | ✅ | — |
| **Void Linux** | — | ✅ | ✅ | — | ⚠️ |
| **NixOS** | — | ⚠️ | — | — | — |
| **ChimeraOS** | — | ✅ | ✅ *(native)* | — | — |
| **Vanilla OS** | ✅ *(native)* | ✅ | — | — | — |
| **blendOS** | — | ✅ | — | ✅ *(native)* | — |

## Architecture Support

| Architecture | Notes |
|---|---|
| `x86_64` | All backends supported |
| `aarch64` | All backends supported; btrfs-dwarfs requires kernel module build |
| `armv7` | ashos, akshara; btrfs-dwarfs untested |
| `riscv64` | ashos, akshara; others untested |
| `ppc64le` | ashos, akshara; others untested |
| `s390x` | ashos, akshara; others untested |

## Filesystem Requirements

| Backend | Required FS | Notes |
|---|---|---|
| abroot | ext4 or LVM thin | A/B partitions; BTRFS not required |
| ashos | btrfs | Snapshot tree lives in BTRFS subvolumes |
| frzr | btrfs | Images deployed as read-only BTRFS subvolumes |
| akshara | btrfs | System image stored as BTRFS subvolume |
| btrfs-dwarfs | btrfs + block device for DwarFS | Two partitions required |

## Init System Support

| Init System | Notes |
|---|---|
| systemd | All backends; ILF ships systemd units |
| runit | Void Linux; replace `.service` units with runit `sv` |
| OpenRC | Alpine, Gentoo; replace `.service` units with OpenRC init scripts |
| s6 | Untested; manual service setup required |
