# ✈️ The Navigator: `parser` (Detection and Template Rendering)

The `parser` package is the navigation office of **coa**. When the CLI receives the departure order, the parser is the one who opens the maps, checks the weather (the host system) and traces the exact route by rendering the templates of the Brain.

Its responsibility is purely logical and structural: it turns the *human-readable* Brain into a rigorous, typed `Profile` struct, ready to be handed to the planner. It executes nothing.

---

## 🗺️ 1. The Detection Algorithm: `DetectAndLoad()`

This function is the beating heart of the package. Instead of forcing the user to specify which profile to use, the parser figures it out by itself:

1. **Identity:** uses `distro.NewDistro()` to read `/etc/os-release` and learn who the host is.
2. **Dev/Prod fallback:** looks for the Brain intelligently — first the local development path (`coa/brain.d`), then the production system path (`/etc/penguins-eggs.d/brain.d`). The tool works both while you write code and once installed on the end user's OS.
3. **Index parsing:** reads `index.yaml`, decoding it into the `BrainIndex` structure.
4. **Matching engine:** walks the `Distributions` list (`DistroMap` entries: `id`, `like`, `file`), looking for an exact match on the distro ID or an indirect match through the `like` array (e.g. it understands that a Debian derivative must use the Debian module).

---

## 🧩 2. Template Rendering: the Frame and the Module

This is where the current architecture departs from the old "one static YAML per distro" model. The Brain is made of **Go `text/template` files**:

* **`base.yaml.tmpl`** — the universal frame: the skeleton of the remaster flight, identical for every distribution.
* **`modules/<distro>.bash.tmpl`** — the distro-specific module selected through `index.yaml` (`alpine`, `arch`, `manjaro`, `debian`, `fedora`, `opensuse`).

The parser compiles *base + module* in a single template engine, enriched with two helper functions:

* `include` — renders a named sub-template into a string, so the base frame can pull blocks defined by the module;
* `indent` — re-indents multi-line blocks, keeping the generated YAML syntactically valid.

The rendering context (`TemplateContext`) exposes `Family`, `DistroID` and `IsGitHubAction`, letting the templates adapt declaratively to the host.

The rendered output is finally decoded with `yaml.Unmarshal` into the `Profile` struct. **Emergency dump:** if the generated YAML is malformed, the parser saves the rendered text to `/tmp/oa-failed-yaml.txt` so you can inspect exactly what the template produced.

---

## 🧬 3. The Data Structures (the Profile DNA)

* **`Profile`**: the root — two arrays of steps (`Remaster` and `Install`) plus the `Settings`.
* **`Step`**: the fundamental unit of work. The modern standard is three fields:
  * `Module`: which executor handles the step (`shell`, `template`, `users`, `mksquashfs`, `xorriso`, …) — see [oa.md](./oa.md) and [ell.md](./ell.md) for the routing;
  * `Chroot`: whether the step runs against the live root instead of the host;
  * `Params`: a free-form map — each worker validates the exact parameters it needs.

  The legacy fields of the action era (`action`, `run_command`, `path`, `src`, `dst`) are still present in the struct but **deprecated**, kept only for the transition.
* **`Settings.Remaster`** (`RemasterConfig`): the user-facing knobs — live `user` and `password`, `work_dir`, and the SquashFS `compression` (algorithm + level).
* **`User`**: the identity record (`login`, `password`, `home`, `shell`, `groups`, `uid`, `gid`) consumed by the native `users` module of the C engine.

---

## 🎛️ 4. The Override: `LoadCustomSettings()`

After the profile is built, the parser looks for `custom.yaml`/`custom.yml` (via Viper) in `/etc/penguins-eggs.d/` or the current directory. If found, its values **replace** `Settings.Remaster` — this is how the end user changes live user, password or compression without ever touching the Brain.

---

### 💡 Pro insight: decoupling

The parser *does not know and does not care* how the steps will be executed. It renders the Brain, validates the result into typed `Step` structs and stops there. It is the `planner` that compiles those steps into the JSON plan, and the engines (`oa` in C, `coa ell` in Go) that execute them. Each stage can be tested in isolation.
