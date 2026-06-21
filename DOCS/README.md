# penguins-eggs (oa edition) Documentation

## Architecture
- [Overview](./architecture/overview.md) — How `coa` (Go) orchestrates the remastering pipeline.
- [The C Arm: `oa`](./architecture/oa.md) — The low-level engine: plan execution, native modules, dispatcher.
- [The Go Craftsman: `coa ell`](./architecture/ell.md) — The worker modules delegated by the C engine.
- [The Navigator: `parser`](./architecture/parser.md) — Detection, YAML template rendering, profile building.
- [The Engineer: `planner`](./architecture/planner.md) — Plan compilation, exclude list, breakpoints.
- [The Universal Strategy](./architecture/universal-strategy.md) — The philosophical and technical framework behind multi-distro support.

## Design
- [Philosophy](./design/philosophy.md) — The three-actor model and the evolution from Bash to C+Go.
- [Installer Architecture](./design/installer.md) — `sysinstall`: one engine, two faces (Calamares GUI + Krill TUI).
- [Roadmap](./design/roadmap.md) — Current status and open points.

## User Manual
- [Quick Start](./manual/quickstart.md) — First ISO in three commands, penguins-eggs compatibility table.
- [Command Reference](./manual/commands.md) — All `coa` commands, flags and usage.

## Development
- [Building](./development/building.md) — Requirements and toolchain for native packages.
- [CI Architecture](./development/ci.md) — Hammers (packaging) and Furnace (remastering) pipelines.
- [Proxmox Integration](./development/proxmox.md) — VirtFS, Guest Agent, serial console setup.
- [Vagrant Lab](./development/vagrant.md) — Local test lab with KVM/libvirt (legacy).

## Other
- [Manifestum](./manifestum.md) — The founding manifesto: origins, vision and call to action.
