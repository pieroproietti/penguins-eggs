# chromiumos-stage3

Arch-agnostic ChromiumOS stage3 builder. Derived from
[sebanc/chromiumos-stage3](https://github.com/sebanc/chromiumos-stage3) (amd64)
and extended to arm64 via [openFyde](https://github.com/openFyde) overlays.

## Boards

| Board | Arch | SoC | Container-suitable |
|---|---|---|---|
| `reven` | amd64 | generic x86_64 | ✅ Yes |
| `arm64-generic` | arm64 | generic arm64 (VMware/QEMU) | ✅ Yes |
| `rpi4` | arm64 | BCM2711 (Raspberry Pi 4B/400) | ⚠️ Hardware-specific |
| `rpi5` | arm64 | BCM2712 (Raspberry Pi 5) | ⚠️ Hardware-specific |
| `rk3588` | arm64 | RK3588S (ROCK 5B, Orange Pi 5, Firefly) | ⚠️ Hardware-specific |
| `rk3399` | arm64 | RK3399 (Rock Pi 4B, ROCK 4C+) | ⚠️ Hardware-specific |
| `orangepi5` | arm64 | RK3588S (Orange Pi 5/5B/5 Plus) | ⚠️ Hardware-specific |

Container-suitable boards produce a generic rootfs with no hardware firmware.
Hardware-specific boards include SoC drivers and are intended for bare-metal use.

## Usage

```bash
# Generic amd64 (default)
sudo ./build.sh

# Generic arm64 (requires qemu-user-static on x86_64 hosts)
sudo apt-get install qemu-user-static
sudo ./build.sh --board arm64-generic

# Raspberry Pi 4
sudo ./build.sh --board rpi4

# Rockchip RK3588 family
sudo ./build.sh --board rk3588

# Control parallelism
sudo ./build.sh --board reven --jobs 8

# Custom output directory
sudo ./build.sh --board arm64-generic --output /mnt/storage
```

## Requirements

- Root access
- ~10 GB free disk space (amd64), ~12 GB (arm64)
- `qemu-user-static` — arm64 builds on x86_64 hosts only
- `git`, `curl`, `tar`, `xz`, `zstd`

## Output

`chromiumos-stage3-<board>-<release>.tar.xz` in the output directory.

Pre-built tarballs for `reven` and `arm64-generic` are published via GitHub
Actions on every ChromiumOS release branch (weekly schedule).

## Adding a new board

1. Create `boards/<name>.conf` following the existing pattern
2. Set `BOARD`, `ARCH`, `CHOST`, `BOOTSTRAP_URL`, `PROFILE_PATH`
3. Set `OVERLAY_REPO` / `FOUNDATION_REPO` if the board needs openFyde overlays
4. Run `sudo ./build.sh --board <name>`

## Overlay sources

| Board | Overlay source |
|---|---|
| `reven` | upstream ChromiumOS (`chromium.googlesource.com`) |
| `arm64-generic` | [openFyde/overlay-arm64-openfyde_vmware](https://github.com/openFyde/overlay-arm64-openfyde_vmware) |
| `rpi4` | [openFyde/overlay-rpi4-openfyde](https://github.com/openFyde/overlay-rpi4-openfyde) |
| `rpi5` | [openFyde/overlay-rpi5-openfyde](https://github.com/openFyde/overlay-rpi5-openfyde) |
| `rk3588` | [openFyde/foundation-rk3588](https://github.com/openFyde/foundation-rk3588) + [overlay-rock5b-openfyde](https://github.com/openFyde/overlay-rock5b-openfyde) |
| `rk3399` | [openFyde/foundation-rk3399](https://github.com/openFyde/foundation-rk3399) + [overlay-rockpi4b-openfyde](https://github.com/openFyde/overlay-rockpi4b-openfyde) |
| `orangepi5` | [openFyde/foundation-rk3588](https://github.com/openFyde/foundation-rk3588) + [overlay-orangepi5-openfyde](https://github.com/openFyde/overlay-orangepi5-openfyde) |

All arm64 boards apply [openFyde/project-openfyde-patches](https://github.com/openFyde/project-openfyde-patches).
