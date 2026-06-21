# 🥚 Philosophy: The Evolutionary Architecture of penguins-eggs (oa edition)
## This document traces the architectural phylogeny of penguins-eggs (oa edition).

To understand its architecture, one must understand its genesis. The original penguins-eggs project was born seven or eight years ago from a bold, almost biological intuition: to introduce evolutionism into operating systems.
By equipping a live system with the ability to reproduce itself (remastering), the software is no longer a static artifact. It is allowed to mutate—acquiring user customizations and new configurations—leaving the ultimate variance and natural selection to the environment. The operating systems that adapt best to user needs survive, get installed, and are replicated further.

The new penguins-eggs architecture is simply the next evolutionary leap of this reproductive system. It evolved from the need to balance configuration flexibility (variance) with execution robustness (survival), leaving behind the physiological limits of dynamically generated shell scripts.

The conceptual heart revolves around the wordplay that gives the project its soul: in dialect, *oa* means eggs. The orchestrator *coa* prepares the ground and the environment ("broods the egg"), letting life take shape in the operating system.

### 1. The Problem: The Polluted "Brain"

In the early versions, the power of the tool relied on the generation of a monolithic Bash script (e.g. `common.bash.tmpl`).
This approach forced the planning engine (the "Brain") to play two conflicting roles:

1. **Declarative:** reading YAML files and merging variables.
2. **Imperative:** writing strings of Bash code to execute commands (`oa_shell`).

The result was a "dirty" Brain, hard to maintain, with execution delegated to fragile sub-shells prone to errors that could not be traced at a granular level.

### 2. The Solution: The Three-Actor Model (on two tracks)

The definitive architecture embraces the *Unix Philosophy*, splitting responsibilities into watertight compartments. The flow moves from script generation to a true **delegation of execution (Master-Worker)**.

The ecosystem rests on three logical roles, physically implemented in just two executables (`coa` and `oa`):

#### A. The Pure Planner (Go)

* **Role:** it is the Mind. Its sole purpose is to translate the user's wishes (YAML) into a rigorous, formal state.
* **What it does:** it reads `base.yaml`, applies the overrides from `custom.yaml` and generates a "Single Source of Truth" file: `oa-plan.json`.
* **Philosophy:** the Brain is completely "drained". It knows no Bash syntax and launches no processes. It produces pure data only.

#### B. The Site Foreman: `oa` (C)

* **Role:** it is the Muscle and the Director of Works in the field.
* **What it does:** it is fed `oa-plan.json`. It builds the execution tree and drives the time loop step by step.
* **Philosophy:** it keeps root privileges and works close to the metal. When it meets a pure system action (`chroot`, `mount`, user manipulation) it uses its C system calls. It is a single, cohesive block, blind to the overall plan but infallible at its specific task.

#### C. The Specialized Craftsman: `ell` (Go, integrated as `coa ell`)

* **Role:** it is the high-level Technician. It definitively replaces the use of Bash scripts for complex operations.
* **What it does:** it is a hidden subcommand of the main Go executable (*Multi-call binary* pattern, like Git or Docker). When the foreman `oa` (C) has to perform a complex operation such as generating a SquashFS filesystem or an ISO, it no longer launches `/bin/bash`, but performs a system call towards:
  `coa ell --plan oa-plan.json --module squashfs`
* **Philosophy:** it exploits Go's native power for fast I/O, safe typing and granular error handling (e.g. invoking `mksquashfs` natively via `os/exec`), then returns control to the C daemon.

### 3. Advantages of the Model (the "Strangler" Pattern)

This architecture does not require rewriting everything from scratch overnight; it allows a gentle transition:

1. **Logistic stability:** the end user keeps downloading just the two original binaries. The directory tree stays clean.
2. **Cognitive and semantic advantage:** the calls follow a natural grammar (Subject + Verb -> `coa ell`, `git commit`), making the logs clear and the intent self-documenting.
3. **Death of the sub-shells:** the Bash initialization cost and the risks tied to character escaping are eliminated. Everything becomes typed and traceable (instant fail-fast at the first error).

### 4. The Operational Workflow

1. **Planning:** `coa` -> YAML -> JSON.
2. **Handover:** `coa` launches `oa`, passing it the JSON.
3. **Mixed execution:** `oa` iterates over the JSON:
   * Low-level modules -> `oa` executes it in C (users, umount)
   * High-level modules -> `oa` natively invokes `coa ell` (Go).

***Software is like an organism: it does not evolve by destroying its own DNA, but by specializing its cells for ever more focused tasks.***
