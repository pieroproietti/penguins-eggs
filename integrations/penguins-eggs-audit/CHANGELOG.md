# Changelog

## [0.1.0] — 2025

### Added

**Security & Audit domain (Phase 7)**
- `plugins/security-audit/vouch-attest/` — cryptographic attestation for eggs ISO artifacts via [mitchellh/vouch](https://github.com/mitchellh/vouch)
- `plugins/security-audit/os-hardening/` — OS hardening scripts applied to eggs chroots via [Opsek/OSs-security](https://github.com/Opsek/OSs-security); includes `setup.sh` for sparse-cloning upstream scripts and a `postinstall` npm hook
- `plugins/security-audit/linux-suite/` — bundles [Nerds489/ultimate-linux-suite](https://github.com/Nerds489/ultimate-linux-suite) into eggs costumes

**SBOM & Supply Chain domain (Phase 8)**
- `plugins/sbom/syft-generate/` — SBOM generation for ISO filesystems via [anchore/syft](https://github.com/anchore/syft); supports SPDX-JSON, CycloneDX-JSON, Syft-JSON
- `plugins/sbom/grant-license/` — license compliance scanning via [anchore/grant](https://github.com/anchore/grant); includes `initPolicy()` for generating a default `.grant.yaml`
- `plugins/sbom/sbom-reference/` — SBOM augmentation and enrichment following [CISA SBOM Generation](https://github.com/SBOM-Community/SBOM-Generation) reference implementations

**src entry points**
- `src/security-audit/index.ts` — exports `VouchAttest`, `OsHardening`, `LinuxSuite` and all types
- `src/sbom/index.ts` — exports `SyftGenerate`, `GrantLicense`, `SbomReference` and all types
- Root `src/index.ts` updated to re-export both new domains

**Tests**
- 220 passing tests across 8 phases (14 new tests for `WardrobeBrowse` in phase 3; 18 new tests across phases 7 and 8)
- `test/phase7/`: `vouch-attest`, `os-hardening`, `linux-suite`
- `test/phase8/`: `syft-generate`, `grant-license`, `sbom-reference`

**CI & quality**
- `.github/workflows/ci.yml`: build + test on Node 20/22, frogbot security scan on PRs, `grant` license compliance check, structural validation
- `.github/frogbot-config.yml`: frogbot PR scan configuration
- `.grant.yaml`: version-controlled license policy (deny GPL-3.0/AGPL-3.0, allow MIT/Apache-2.0/BSD/ISC/LGPL-2.1/MPL-2.0)
- `test/validate.sh`: extended to 87 checks covering new domains, src entry points, docs content, and CI files
- `CONTRIBUTING.md`: plugin pattern guide, step-by-step instructions, domain/phase table, code style rules

**Documentation**
- `README.md`: updated to 8 domains, 39 projects, phases 7 & 8, updated structure tree
- `ARCHITECTURE.md`: updated ASCII diagram, Domain 7 and Domain 8 sections, phases 7 & 8
- `INTEGRATION-SPEC.md`: Phase 7 and Phase 8 specs with CLI, config, and acceptance criteria
- `PROJECT-CATALOG.md`: updated to 39 projects; new Security & Audit and SBOM & Supply Chain tables

### Forked from

[Interested-Deving-1896/penguins-eggs-integrations](https://github.com/Interested-Deving-1896/penguins-eggs-integrations) — 31 projects across 6 domains (Distribution, Decentralized, Config Management, Build Infrastructure, Dev Workflow, Packaging)
