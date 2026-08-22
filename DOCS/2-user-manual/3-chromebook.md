# Chromebook Support and Special Hardware Workflows

Chromebooks represent a unique use case in the Linux live environment ecosystem. They feature highly custom hardware engineered for ChromeOS, including proprietary Google chipsets, ChromeOS Embedded Controllers (EC), and specialized eMMC storage controllers.

This guide explains the design philosophy behind `penguins-eggs` regarding special hardware, and provides a step-by-step workflow for preparing source Chromebook systems (such as the BARLA Chromebook platform) before generating a live ISO.

### Chromebook Upcycling Process Overview

Upcycling EOL/AUE (Automatic Update Expiry) Chromebooks into fully functional general-purpose Linux laptops typically follows three core steps:

1. **Disable Hardware Write-Protect (WP)**
   Chromebooks ship with a hardware protection mechanism that prevents overwriting Google's stock firmware.
   * To flash a custom UEFI BIOS, you must first disable Write-Protect (WP).
   * On older models, this simply requires opening the chassis and removing a dedicated **WP screw** or temporarily disconnecting the main battery.
   * On newer devices, disabling WP may require specific terminal commands or a SuzyQable (USB-C debug cable).
   * Refer to the official [MrChromebox Documentation](https://docs.mrchromebox.tech/) for device-specific WP removal instructions and firmware updates.

2. **Replace Stock Firmware (Coreboot / TianoCore)**
   Once hardware protection is disabled, boot the Chromebook into Developer Mode and execute the firmware update script (typically the MrChromebox Utility Script).
   * The script replaces Google's proprietary firmware with an open-source alternative: **Coreboot** coupled with a **TianoCore** payload (providing a standard UEFI interface).
   * After flashing, the device ceases to be a locked Chromebook and functions as a standard x86 PC (like any traditional laptop from Dell, Lenovo, or HP), capable of booting from a standard USB drive.

3. **Install Linux using penguins-eggs & Krill**
   With TianoCore UEFI active:
   * Insert a USB flash drive containing a Live ISO generated with `penguins-eggs`.
   * Boot the system and format the internal drive, completely replacing ChromeOS.
   * **penguins-eggs** and **Krill** streamline this phase: the custom Live ISO allows volunteers, educators, and students to instantly verify hardware compatibility (Wi-Fi, audio, keyboard, touchpad) and run a fast, reliable installation to deploy a clean, ready-to-use Linux laptop.

---

## Architectural Philosophy: Hardware-Agnostic Design

`penguins-eggs` is engineered to be **hardware-agnostic**. 

Forcing Chromebook-specific kernel drivers and modules into the default `eggs` remastering engine for all target builds is explicitly avoided for several reasons:
- **Initramfs Bloat**: Including niche modules unnecessarily inflates the initramfs size for standard desktop and server hardware.
- **System Stability**: Adding unnecessary platform drivers across general distributions increases potential kernel boot complications.
- **Separation of Concerns**: System preparation should happen on the target source system (or via pre-execution hook scripts), keeping the core remastering engine clean and predictable.

---

## Chromebook System Preparation Workflow

To ensure proper boot performance and eMMC storage access on Chromebook hardware, the required kernel modules must be included in the initramfs of the source system before invoking `eggs`.

### 1. Add Chromebook Modules to initramfs-tools

Edit or append the following 8 kernel modules to `/etc/initramfs-tools/modules`:

```text
mmc_core
sdhci
sdhci_pci
mmc_block
cqhci
intel_lpss_pci
cros_ec
cros_ec_i2c
```

#### Module Descriptions
- `mmc_core`, `sdhci`, `sdhci_pci`, `mmc_block`, `cqhci`: Core eMMC and SD controller drivers required to recognize the primary internal storage.
- `intel_lpss_pci`: Intel Low Power Subsystem PCI driver required for low-level bus enumeration on Intel-based Chromebooks.
- `cros_ec`, `cros_ec_i2c`: ChromeOS Embedded Controller interfaces (manages keyboard, power, thermal, and platform hardware).

### 2. Update the initramfs

Rebuild the initramfs on the host system to incorporate the newly specified modules:

```bash
sudo update-initramfs -u
```

### 3. Generate the ISO with eggs

Once the initramfs of the host system has been updated, run `eggs` to produce the remastered live ISO:

```bash
sudo eggs remaster
```

---

## Module Compatibility and Ordering Notes

- **Conflict-Free**: Pre-populating `/etc/initramfs-tools/modules` with these modules is safe. If booted on standard non-Chromebook hardware, unused modules are simply ignored by the Linux kernel without causing failures.
- **Dependency Resolution**: The order of entries in `/etc/initramfs-tools/modules` does not matter; `initramfs-tools` automatically handles dependency resolution for all listed kernel modules.

---

## Summary Script

For automated deployment or scriptable preparation of Chromebook host systems, you can use the following snippet prior to running `eggs`:

```bash
#!/usr/bin/env bash
set -euo pipefail

MODULES=(
    "mmc_core"
    "sdhci"
    "sdhci_pci"
    "mmc_block"
    "cqhci"
    "intel_lpss_pci"
    "cros_ec"
    "cros_ec_i2c"
)

echo "Adding Chromebook modules to /etc/initramfs-tools/modules..."
for mod in "${MODULES[@]}"; do
    if ! grep -q "^${mod}$" /etc/initramfs-tools/modules 2>/dev/null; then
        echo "${mod}" | sudo tee -a /etc/initramfs-tools/modules > /dev/null
    fi
done

echo "Updating initramfs..."
sudo update-initramfs -u

echo "System ready for eggs remastering."
```

---

## References & Community Resources

- **Firmware & Coreboot Tooling**: [MrChromebox Official Documentation](https://docs.mrchromebox.tech/) – Essential guides for hardware WP removal, Coreboot installation, and UEFI scripts.
- **Community Upcycling & Rescue Initiatives**:
  - [Fixit Clinic Chromebook Rescue at SudoRoom](https://sudoroom.org/chromebook-rescue-at-sudoroom/) – Overview of the community-led effort to rescue AUE Chromebooks and convert them into general-purpose laptops.
  - [Fixit Clinic Official Blog](https://fixitclinic.blogspot.com/) – News and documentation on repairability events, hardware upcycling, and community repair clinics.
  - [iFixit](https://www.ifixit.com/) – Open repair guides, teardowns, and hardware disassembly manuals.
  