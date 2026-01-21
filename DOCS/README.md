# Start Developing with penguins-eggs

`penguins-eggs` is a versatile tool for remastering Linux distributions. It supports multiple families: **Debian**, **Arch**, **Alpine**, and **Fedora**.

*   **Debian/Arch**: Support is mature, reproducible, and package creation is fully functional.
*   **Alpine/Fedora**: Support is mature.

## Prerequisites

To start contributing or modifying `eggs`, you need:

*   **Node.js**: Checked against the `.nvmrc` or `package.json` engines.
*   **pnpm**: The package manager used in this project.
*   **git**: For version control.
*   **Text Editor**: VS Code is recommended, but any editor works.

**Note**: It is strongly recommended to **fork** the repository to your own GitHub account before starting.

## Getting Started

1.  **Fork** the project at [pieroproietti/penguins-eggs](https://github.com/pieroproietti/penguins-eggs).
2.  **Clone** your fork locally.
3.  **Install dependencies**:
    ```bash
    pnpm install
    ```
4.  **Build**:
    ```bash
    pnpm build
    ```
5.  **Run locally**:
    ```bash
    ./bin/run --help
    ```

## Historical Context

The project has evolved significantly over time:

1.  **Origins**: Started with Debian/Ubuntu remastering using `npm` packages.
2.  **Packaging Evolution**: Moved to native `.deb` packages using `oclif` and `perrisbrewery` to manage dependencies and install scripts properly.
3.  **Expansion**: Extended to support **Arch Linux** (integrating `pacman` and `PKGBUILD` logic), and later **Alpine** and **Fedora**.
4.  **Current State**: `eggs` is now a modular TypeScript application that delegates low-level package management to the host system's tools (`apt`, `pacman`, `apk`, `dnf`) while providing a unified abstraction layer.

## Project Structure

`eggs` is built using **TypeScript**, **Bash**, and **YAML**.

### TypeScript
The core logic resides in [`src/`](./SOURCE.md). See [SOURCE.md](./SOURCE.md) for a detailed breakdown of the class hierarchy and architectue.

### Bash
Bash scripts are used for low-level system operations and are located in `scripts/` or embedded within templates.

### YAML
Configuration is handled via YAML files located in [`conf/`](../conf/). This includes distro definitions, detailed configurations for `eggs`, handling of `krill` installer, and `calamares` integration.

## Documentation References

*   [The Nest](./THE-NEST.md): Understanding the working directory structure.
*   [Source Code Overview](./SOURCE.md): Guide to the codebase organization.

### Family-Specific Guides
*   [Way to Debian](./WAY-TO-DEBIAN.md)
*   [Way to ArchLinux](./WAY-TO-ARCHLINUX.md)
*   [Way to AlpineLinux](./WAY-TO-ALPINE.md)
*   [Way to Fedora](./WAY-TO-FEDORA.md)
