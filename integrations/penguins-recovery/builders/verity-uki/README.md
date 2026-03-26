# builders/verity-uki

Builds a dm-verity verified, Secure Boot-signed recovery UKI (Unified Kernel Image).

## Chain of trust

```
UEFI firmware
  └─ verifies signature on → recovery-verified.efi (UKI)
       └─ cmdline embeds root hash → dm-verity Merkle tree
            └─ verifies integrity of → recovery.squashfs (rootfs)
```

An attacker who modifies `recovery.squashfs` on disk will cause boot to fail with a verity error. The recovery environment itself cannot be tampered with silently.

## Relationship to other builders

| Builder | Base | Signing | Verity |
|---|---|---|---|
| `uki` | mkosi + Arch | optional sbctl | no |
| `uki-lite` | host kernel + objcopy | optional sbctl | no |
| **`verity-uki`** | **host kernel + objcopy** | **sbsign (required)** | **yes** |

## Usage

```bash
# Build with auto-detected kernel/initrd, no signing
sudo ./build.sh --no-sign

# Build with Secure Boot signing
sudo ./build.sh --key /etc/verity_squash_root/db.key --cert /etc/verity_squash_root/db.crt

# Build from an existing SquashFS (e.g. from builders/debian or adapters/)
sudo ./build.sh --squashfs /path/to/recovery.squashfs --key db.key --cert db.crt

# Build from a custom rootfs directory
sudo ./build.sh --rootfs /path/to/rootfs --output my-recovery.efi

# Via Makefile
make verity-uki
make verity-uki SIGN=1 KEY=/etc/keys/db.key CERT=/etc/keys/db.crt
```

## Output files

| File | Description |
|---|---|
| `recovery-verified.efi` | Signed UKI — copy to ESP |
| `recovery.squashfs` | Compressed recovery rootfs |
| `recovery.squashfs.verity` | dm-verity hash tree |
| `root-hash.txt` | dm-verity root hash (embedded in UKI cmdline) |

## Dependencies

```
squashfs-tools    # mksquashfs
cryptsetup-bin    # veritysetup
binutils          # objcopy
sbsigntool        # sbsign (for Secure Boot signing)
systemd-boot-efi  # EFI stub (or specify --stub)
```

## Secure Boot key generation

Use `verity-squash-root` or `sbctl` to generate keys:

```bash
# With verity-squash-root
verity-squash-root --ignore-warnings create-keys

# With sbctl
sbctl create-keys
```

Import the public key into your UEFI firmware to enable Secure Boot verification.

## Origins

- [brandsimon/verity-squash-root](https://github.com/brandsimon/verity-squash-root) — dm-verity + SquashFS + UKI concept
- [containerd/go-dmverity](https://github.com/containerd/go-dmverity) — dm-verity reference implementation
- [builders/uki-lite](../uki-lite/) — UKI assembly via objcopy
