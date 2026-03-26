# builders/lifeboat

Alpine-based single-file UEFI rescue system. Produces `LifeboatLinux.efi` —
a ~35 MB EFI executable containing a complete Linux kernel with an Alpine
initramfs embedded. Drop it on any EFI System Partition and boot; no USB
stick required.

Based on [hugochinchilla/lifeboat_linux](https://github.com/hugochinchilla/lifeboat_linux).

## What's included

- Alpine Linux 3.21 userland (apk, busybox, openrc)
- Rescue tools: parted, efibootmgr, gptfdisk, fdisk, lvm2, cryptsetup,
  dmraid, mdadm, e2fsprogs, dosfstools, xfsprogs, btrfs-progs, testdisk
- Editors: nano, vim
- penguins-recovery shared scripts injected into `/root/rescue-scripts/`
- UserScripts hook: files placed at `(ESP)/EFI/Boot/Lifeboat/UserScripts/`
  are available at `/mnt/efi/EFI/Boot/Lifeboat/UserScripts/`; a file named
  `init` is sourced on login

## Dependencies

| Tool | Purpose |
|---|---|
| `wget` | Download Alpine rootfs and kernel source |
| `unshare`, `chroot` | Build rootfs without root (user namespaces) |
| `fakeroot` | Create device nodes without root |
| `gcc`, `make`, `bc`, `flex`, `bison`, `libelf-dev`, `libssl-dev` | Kernel build |

Install on Debian/Ubuntu:
```
sudo apt install wget fakeroot gcc make bc flex bison libelf-dev libssl-dev
```

Install on Arch:
```
sudo pacman -S wget fakeroot gcc make bc flex bison libelf openssl
```

## Building

```
# Full build (fetch → install → configure → build)
cd builders/lifeboat
make

# Or from the repo root
make lifeboat
```

The output is `builders/lifeboat/dist/LifeboatLinux.efi`.

Incremental builds are possible but can be contaminated by a previous run.
Always prefer `make clean && make` for a release build.

```
# Kernel menuconfig (after make fetch)
make menuconfig

# Clean all artifacts
make clean
```

## Installing

Copy the EFI file to your ESP:

```
cp dist/LifeboatLinux.efi /boot/efi/EFI/Boot/LifeboatLinux.efi
```

Then add a boot entry with `efibootmgr` or let your bootloader discover it.
If using systemd-boot, place it under `EFI/Linux/` for automatic discovery.

### Secure Boot

Sign the output with `sbctl` after building:

```
sbctl sign dist/LifeboatLinux.efi
```

## User customization

Place scripts in `(ESP)/EFI/Boot/Lifeboat/UserScripts/`. The `userscripts`
OpenRC service mounts the ESP read-only at `/mnt/efi` on boot. A file named
`init` in that directory is sourced by `/etc/profile` on login — use it to
set keyboard layout, font size, aliases, or run custom mounts.

## Build pipeline

| Script | What it does |
|---|---|
| `01_get.sh` | Downloads Alpine minirootfs and Linux kernel tarball |
| `02_chrootandinstall.sh` | Installs packages via `apk` inside an unshare chroot |
| `03_alpine_config.sh` | Configures hostname, services, config files, injects rescue scripts |
| `04_kernel_config.sh` | Generates `defconfig` then merges `zfiles/config.minimal` |
| `05_build.sh` | Compiles kernel + modules, embeds initramfs, copies `.efi` to `dist/` |

## Comparison with other builders

| | lifeboat | uki | uki-lite |
|---|---|---|---|
| Base | Alpine Linux | Arch Linux | host system |
| Build tool | custom shell scripts | mkosi + systemd-ukify | objcopy |
| Output | ~35 MB EFI binary | EFI binary | EFI binary |
| Rootfs | built from Alpine minirootfs | built by mkosi | host initrd |
| Dependencies | gcc, make, wget, fakeroot | mkosi, systemd | binutils |
| Wireless | no (keeps image small) | depends on config | depends on host |
