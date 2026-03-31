# syft-generate

SBOM generation for eggs ISO artifacts using [anchore/syft](https://github.com/anchore/syft).

## Usage

```bash
# Generate SBOM during produce
eggs produce --sbom

# Generate SBOM for an existing ISO
eggs sbom generate <iso-path>
eggs sbom generate --format cyclonedx-json <iso-path>
```

## Supported formats

| Format | Flag |
|---|---|
| SPDX JSON | `spdx-json` (default) |
| CycloneDX JSON | `cyclonedx-json` |
| Syft JSON | `syft-json` |
| SPDX tag-value | `spdx-tag-value` |

## Configuration

```yaml
# /etc/penguins-eggs.d/sbom.yaml
sbom:
  enabled: true
  format: spdx-json
  output_dir: /var/eggs/sbom
  attach_to_release: true
```

## Dependencies

- `syft` binary on PATH — install from https://github.com/anchore/syft#installation
- `mount` with loop device support (requires root or `udisksctl`)
