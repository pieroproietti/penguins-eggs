# 🪞 The Principle of Transparency

The **Principle of Transparency** is the golden rule for engineering a universal remastering engine in **penguins-eggs**. In short: **the installer must be completely opinionless.** It should act as a perfect mirror of the original system.

When `eggs` (via `coa` / `oa`) clones and reinstalls an OS, it must not force generic standards (like a vanilla GRUB) onto target systems. The end-user should find the installed environment configured exactly as the original distribution's developers intended.

---

## 🏛️ The Three Pillars

### 1. Evidence-Based Detection (Configs over Binaries)
Instead of checking if a bootloader executable exists (e.g., `command -v grub-install`), the installer looks for active configuration files. A distro might have GRUB installed for legacy reasons but actively use `systemd-boot` or `Limine`. The installer decides what to do based on hard evidence:

* **Found `/boot/limine.conf` or `/boot/efi/limine.conf`?** The distro uses **Limine**.
* **Found `/boot/loader/loader.conf` or `/boot/efi/loader/loader.conf`?** The distro uses **systemd-boot**.
* **Found `/etc/default/grub` or `/boot/grub/grub.cfg`?** The distro uses **GRUB**.

### 2. Preserving the Original DNA
An installer should never overwrite the distro's configurations with generic templates. If a distro uses a heavily customized GRUB (e.g., with `grub-btrfs` for snapshots) or specific kernel parameters (e.g., performance optimizations or security overrides), `eggs` preserves them intact. It extracts parameters from the original system and ports them directly into the target configuration.

### 3. Relying on Native Tools
Once the files are copied to the target disk, the installer enters the chroot environment and invokes the distro's native tools directly:

* **For systemd-boot:** runs native `bootctl install`.
* **For GRUB:** ensures `GRUB_DISABLE_OS_PROBER=false` is set for dual-boot detection in `/etc/default/grub`, then runs the native `grub-mkconfig` / `update-grub`.
* **For Limine:** runs `limine bios-install` or installs the native UEFI binary.

---

## 🌟 The Ultimate Benefit

This approach eliminates the burden of maintaining endless distro-specific edge cases. You don't need dedicated exceptions for every single Arch or Debian derivative. You clone their files, invoke their native update scripts, and let the OS assemble itself using its original logic.
