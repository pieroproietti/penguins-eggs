# Chromebook Support and Special Hardware Workflows

Chromebooks represent a unique use case in the Linux live environment ecosystem. They feature highly custom hardware engineered for ChromeOS, including proprietary Google chipsets, ChromeOS Embedded Controllers (EC), and specialized eMMC storage controllers.

This guide explains the design philosophy behind `penguins-eggs` regarding special hardware, and provides a step-by-step workflow for preparing source Chromebook systems (such as the BARLA Chromebook platform) before generating a live ISO.

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
sudo eggs produce
```
*(or `sudo eggs remaster` depending on your build target)*

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
