# Gemini Project Context: penguins-eggs

## Project Overview

`penguins-eggs` is a command-line tool for remastering AlmaLinux, AlpineLinux, Arch, Debian, Devuan, Fedora, Manjaro, Openmamba, openSuSE, RockyLinux, Ubuntu and derivative systems. It allows users to create a live, bootable ISO image of their current system, with optional LUKS encryption, which can be used for backups, distribution, or creating custom operating system versions. The project is written in TypeScript and built using the oclif framework for CLIs.

Can use two different system installer:
- **krill**: `sudo eggs install` is a TUI system installer, always included and operational
- **calamares**: calamares is the GUI system installer used by eggs.

## Tech Stack

- **Language:** TypeScript
- **Framework:** [oclif](https://oclif.io/) (for building the CLI)
- **Package Manager:** npm (or pnpm, based on `pnpm-lock.yaml`)
- **Testing:** Mocha (test runner), Chai (assertion library)
- **Linting:** ESLint
- **Formatting:** Prettier

## Development Key Commands

- **Installation:** `npm install` or `pnpm install`
- **Build:** `npm run build` (compiles TypeScript to JavaScript in `dist/`)
- **Run Tests:** `npm test`
- **Lint Code:** `npm run lint`
- **Run the CLI locally:** `./bin/run [COMMAND]` (e.g., `./bin/run eggs --help`)

## User Key Commands
- **eggs love** get your ISO in one command (run: eggs krll, eggs dad -d, eggs, tools clean and produce)
- **eggs kill** remove old createed ISOs
- **eggs dad** configure eggs

## Project Structure

- `src/`: Contains the TypeScript source code for all commands and hooks.
- `dist/`: Contains the compiled JavaScript code (output of the build process).
- `test/`: Contains the Mocha/Chai tests.
- `conf/`: Contains configuration files used by eggs.
- `manpages/`: Man pages for the CLI commands.
- `package.json`: Defines project metadata, dependencies, and scripts.
- `pnpm-lock.yaml`: Indicates that pnpm is the preferred package manager.

## Related Repositories (Project Ecosystem)
- **[penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe)**: t is a repository mainly consisting of .yaml files and simple bash scripts used by eggs to create customizations of Linux systems starting from a minimal image - referred to as "naked" - to achieve a complete system.

- **[fresh-eggs](https://github.com/pieroproietti/fresh-eggs)**: fresh-eggs: install penguins-eggs and configure it on your AlmaLinux, AlpineLinux, Arch, Debian, Devuan, Fedora, Manjaro, Openmamba, openSuSE, RockyLinux, Ubuntu and most derivatives.

- **[penguins-eggs-repo](https://github.com/pieroproietti/penguins-eggs-repo)**: The repository hosting official packages for installation and updating of `eggs` on all the distros supported.

- ** https://aur.archlinux.org/packages/penguins-eggs the PKGBUILD used to create paenguins-eggs package from [Chaos](https://aur.chaotic.cx/)

- **[websito](https://github.com/pieroproietti/penguins-blog)**: the source code for the official website **[penguins-eggs.net](https://penguins-eggs.net)**, which includes documentation and user guides.

## Author
- **Piero Proietti <piero.proietti@gmail.com>**