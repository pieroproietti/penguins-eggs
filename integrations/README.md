# penguins-eggs integrations

This directory contains all projects integrated with
[penguins-eggs](https://github.com/Interested-Deving-1896/penguins-eggs) on the
`all-features` branch. It is split into two layers:

1. **Ecosystem tools** — four full companion repos merged as subtrees, each
   with bidirectional hooks into `eggs produce` and related commands.
2. **Plugin integrations** — 46 lightweight plugins extending eggs across six
   feature domains (distribution, decentralized, config management, build
   infrastructure, dev workflow, packaging).

---

## Ecosystem tools

| Directory | Tool | Language | Purpose |
|---|---|---|---|
| [`penguins-recovery/`](penguins-recovery/) | penguins-recovery | Shell | Unified rescue toolkit; layers recovery onto naked ISOs |
| [`penguins-powerwash/`](penguins-powerwash/) | penguins-powerwash | Shell | Factory reset (soft/medium/hard/sysprep/hardware modes) |
| [`penguins-immutable-framework/`](penguins-immutable-framework/) | PIF | Go + Shell | Immutable Linux framework (abroot, ashos, frzr, akshara, btrfs-dwarfs) |
| [`penguins-kernel-manager/`](penguins-kernel-manager/) | PKM | Python | Full kernel lifecycle: fetch → compile → install → hold → remove |
| [`penguins-eggs-audit/`](penguins-eggs-audit/) | penguins-eggs-audit | TypeScript + Shell | Security audit + SBOM framework (39 projects, 8 domains) |
| [`eggs-gui/`](eggs-gui/) | eggs-gui | Go + TypeScript + Python | Unified GUI: Go daemon + BubbleTea TUI + NodeGUI desktop + NiceGUI web |
| [`eggs-ai/`](eggs-ai/) | eggs-ai | TypeScript | AI assistant: diagnostics, build guidance, MCP server, HTTP API |
| [`penguins-distrobuilder/`](penguins-distrobuilder/) | penguins-distrobuilder | Go + Python | Unified distrobuilder: lxc/distrobuilder (Go) + distrobuilder-menu (Python TUI) |
| [`incus-image-server/`](incus-image-server/) | incus-image-server | Elixir + Shell + TypeScript | Simplestreams image server for LXC/LXD/Incus; multi-distro manifests; ChromiumOS stage3 |
| [`penguins-incus-hub/`](penguins-incus-hub/) | penguins-incus-hub | Shell | Integration layer for penguins-incus-platform (PIP): embeds PIP daemon + CLI into ISOs; snapshots Incus guests on reset |

Each tool with lifecycle hooks registers an **eggs plugin** and (where applicable) a **recovery plugin**:

- `<tool>/integration/eggs-plugin/` — called by `eggs produce` to embed tool
  state/binaries into the ISO and coordinate lifecycle events.
- `<tool>/integration/recovery-plugin/` — called by penguins-recovery before
  and after factory resets.

### Hook configuration

| Tool | Config file | Key options |
|---|---|---|
| penguins-recovery | built-in | snapshot label, GUI profile |
| penguins-powerwash | `/etc/penguins-powerwash/eggs-hooks.conf` | `PRE_RESET_EGGS_PRODUCE`, `POST_HARD_RESET_ADAPT` |
| PIF | `pif.toml` `[hooks]` | `pre_upgrade_snapshot`, `post_mutable_produce` |
| PKM | `/etc/penguins-kernel-manager/hooks.conf` | `post_install_notify`, `post_remove_old_sync` |
| penguins-eggs-audit | built-in plugin hooks | SBOM generation, license scan, attestation |
| eggs-ai | `~/.eggs-ai.yaml` | `default_provider`, custom LLM endpoints |
| penguins-distrobuilder | `/etc/penguins-distrobuilder/eggs-hooks.conf` | `DISTROBUILDER_ENABLED`, `DISTROBUILDER_TEMPLATE`, `DISTROBUILDER_TYPE` |
| incus-image-server | `/etc/penguins-distrobuilder/eggs-hooks.conf` | `INCUS_SERVER_URL`, `INCUS_SERVER_TOKEN`, `INCUS_SERVER_PRODUCT` |
| penguins-incus-hub | `/etc/penguins-incus-hub/eggs-hooks.conf` | `EMBED_DAEMON`, `EMBED_CLI`, `PRE_RESET_SNAPSHOT`, `POST_HARD_RESET_RESTART` |

---

## Plugin integrations

46 plugins across 6 domains. See the full list in
[INTEGRATIONS.md](INTEGRATIONS.md) and per-integration specs in
[INTEGRATION-SPEC.md](INTEGRATION-SPEC.md).

| Domain | Plugins | Key projects |
|---|---|---|
| Build Infrastructure | 14 | dwarfs, erofs, verity, mkosi, buildroot, gpt-image, partymix |
| Distribution | 3 | git-lfs, opengist, gentoo-installer |
| Dev Workflow | 2 | ts-ci, security-scan (VerityOps) |
| Decentralized | 4 | brig, git-lfs-ipfs, ipgit, git-ipfs-rehost |
| Config Management | 7 | presslabs/gitfs, dsxack/gitfs, wardrobe merge tools |
| Packaging | 3 | gitpack, github-paser, github-directory-downloader |

Plugin source lives in [`plugins/`](plugins/) and [`src/`](src/).

---

## Documents

| File | Contents |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Full integration map: ecosystem tools + 6 plugin domains |
| [INTEGRATIONS.md](INTEGRATIONS.md) | Plugin table with upstream links and purpose |
| [INTEGRATION-SPEC.md](INTEGRATION-SPEC.md) | Per-plugin specs: trigger, config, CLI, acceptance criteria |
| [PROJECT-CATALOG.md](PROJECT-CATALOG.md) | All upstream projects with descriptions and links |

---

## Directory structure

```
integrations/
├── README.md
├── ARCHITECTURE.md
├── INTEGRATION-SPEC.md
├── INTEGRATIONS.md
├── PROJECT-CATALOG.md
│
├── penguins-recovery/             # ecosystem tool (subtree)
├── penguins-powerwash/            # ecosystem tool (subtree)
├── penguins-immutable-framework/  # ecosystem tool (subtree)
├── penguins-kernel-manager/       # ecosystem tool (subtree)
├── penguins-eggs-audit/           # ecosystem tool (subtree)
├── penguins-distrobuilder/        # ecosystem tool (subtree: distrobuilder/ + menu/)
├── incus-image-server/            # ecosystem tool (subtree: simplestreams server + manifests)
├── penguins-incus-hub/            # ecosystem tool (PIP integration layer)
│
├── eggs-ai/                       # eggs AI assistant (subtree)
├── eggs-gui/                      # eggs unified GUI (subtree)
│
├── plugins/                       # compiled plugin modules
│   ├── build-infra/
│   ├── decentralized/
│   ├── config-management/
│   ├── dev-workflow/
│   ├── distribution/
│   └── packaging/
│
├── src/                           # plugin TypeScript source
│   ├── build-infra/
│   ├── decentralized/
│   ├── config-management/
│   ├── dev-workflow/
│   ├── distribution/
│   └── packaging/
│
└── test/                          # integration tests (phases 1–6)
```
