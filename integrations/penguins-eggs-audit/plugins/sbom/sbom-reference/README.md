# sbom-reference

Adapts the [CISA SBOM Generation reference implementations](https://github.com/SBOM-Community/SBOM-Generation)
to augment and enrich eggs ISO SBOMs with NTIA-required fields.

## Background

The CISA SBOM Generation Tiger Team identified two steps that most SBOM tools skip:

- **Augmentation** — populate top-level metadata (supplier, license, description)
- **Enrichment** — add NTIA-required fields to each component from open datasets

This plugin implements both steps for eggs-produced SBOMs.

## Usage

```bash
# Full pipeline: produce → SBOM → augment → enrich
eggs produce --sbom --augment --enrich

# Standalone augmentation
eggs sbom augment <sbom.spdx.json> --supplier "My Org" --version "1.0.0"

# Standalone enrichment
eggs sbom enrich <sbom.augmented.json>
```

## Pipeline

```
eggs produce
    └─► syft-generate  →  raw SBOM (spdx-json)
            └─► augment    →  top-level metadata added
                    └─► enrich     →  per-component NTIA fields added
                            └─► grant-license  →  license policy check
```

## Dependencies

- [syft-generate](../syft-generate) — for raw SBOM input
- Python 3 + `sbom_enrichment` package (from SBOM-Community/SBOM-Generation) for enrichment
- [grant-license](../grant-license) — for downstream license compliance
