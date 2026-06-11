# ✈️ The Navigator: `parser` (Mapping and Parsing Intelligence)

The `parser` package is the navigation office of **coa**. When the CLI receives the departure order, the parser is the one who opens the maps, checks the weather (the host system) and traces the exact route by reading the YAML files of the Brain.

Its responsibility is purely logical and structural: it turns *human-readable* configuration into rigorous Go data structures, ready to be handed to the planner.

---

## 🗺️ 1. The Detection Algorithm: `DetectAndLoad()`

This function is the beating heart of the package. Instead of forcing the user to specify which profile to use, the parser figures it out by itself through a five-phase process:

1.  **Identity:** uses `distro.NewDistro()` to read `/etc/os-release` and learn the identity of the host system.
2.  **Dev/Prod fallback:** looks for the `brain.d` directory intelligently. It first checks the local development path (`coa/brain.d`) and, failing that, falls back to the production system path (`/etc/oa-tools.d/brain.d`). This guarantees the tool works both while you write code and once it is installed on the end user's OS.
3.  **Index parsing:** reads `index.yaml`, decoding it into the `BrainIndex` structure.
4.  **Matching engine:** walks the list of `Distributions` (mapped by the `DistroMap` struct), looking for an exact match on the `DistroID` or an indirect match through the `Like` array (e.g. it understands that *Pop!_OS* or *Kali* must use the Debian profile).
5.  **Profile loading:** once the right template is found, it reads and decodes it (`yaml.Unmarshal`) into the master `Profile` structure.

---

## 🧬 2. The Data Structures (the Profile DNA)

The package rigorously defines how a YAML profile must be written. This strong Go typing avoids runtime crashes by validating the syntax before any real action is executed.

*   **`Profile`**: the project root. It splits the logic onto two big tracks: an array of steps for the `Remaster` phase and one for the `Install` phase.
*   **`Step`**: the fundamental unit of work. Every block in the YAML maps here.
    *   `Action`: replaces the old ambiguous names with clear semantics (e.g. `oa_shell`, `oa_mount_logic`).
    *   `RunCommand`: the actual payload (the bash script or the string to execute).
    *   `Chroot`: a boolean telling the C engine whether to run the command on the host or perform a `fork()+chroot()` into the isolated environment.
    *   *Path/Src/Dst*: support fields for mount points and file copies.
*   **`User`**: a structure dedicated exclusively to identity. It defines `Login`, `Password`, `Home`, `Shell` and `Groups`. This array is passed straight to the C engine (in the `oa_users` function) to enable the native "Purge & Inject" identity logic.

The package also exposes `LoadCustomSettings()`, which reads the user's custom settings overriding the defaults.

---

### 💡 Pro insight: decoupling

The real masterstroke of the `parser` is decoupling. The parser *does not know and does not care* how the commands will be executed. It just reads the YAML profile selected through `index.yaml` and builds a perfectly validated array of `Step` structs. It is then the `planner` that translates those steps into JSON, and the C engine (`oa`) that executes them. This design makes the system remarkably robust and testable.
