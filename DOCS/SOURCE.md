# SOURCE

The source code is located under `/src` and is organized into the following main directories:

*   **appimage**: Utilities for managing AppImage dependencies.
*   **classes**: Core logic and business rules of the application.
*   **commands**: Implementation of the CLI commands (e.g., `eggs produce`, `eggs dad`).
*   **dhcpd-proxy**: Proxy implementation for DHCP, likely used for PXE boot features.
*   **interfaces**: TypeScript interface definitions for type safety.
*   **krill**: The CLI system installer.
*   **lib**: General utility functions and helper libraries.

## Commands

The `commands` directory contains the implementation of all `eggs` commands. For example, `src/commands/dad.ts` corresponds to `eggs dad`.

Each command class extends the Oclif `Command` class and implements an `async run()` method. This is the entry point for the command's execution, which typically orchestrates operations using various classes.

## Classes

This directory contains the bulk of the application logic. Here are some key classes:

### `distro.ts`

This class is central to handling distribution-specific details. It detects the running distribution and initializes properties such as:

*   **Family ID**: `debian`, `archlinux`, `alpine`, `fedora`, `openmamba`, `opensuse`.
*   **Distro ID**: Specific distribution identifier (e.g., `Ubuntu`, `Manjaro`).
*   **Codename**: Release codename (e.g., `noble`, `trixie`).
*   **Paths**: Locations for live media, squashfs, and system libraries.

It abstracts the differences between distributions, allowing `eggs` to run on a wide variety of systems.

### `incubation/incubator.ts`

The `Incubator` class is responsible for the "incubation" phase, which prepares the system for the installation or ISO creation process. It loads distribution-specific logic from `src/classes/incubation/distros/` to handle differences in configuration and setup.

### `ovary.ts`

`Ovary` is the core orchestrator class for the `produce` command. It manages the entire lifecycle of the ISO creation process, including:
*   Creating the work directory structure (The Nest).
*   Handling partition mounting and binding.
*   Managing encryption (LUKS).
*   Generating the ISO image.

### `pacman.ts`

Despite the name, `Pacman` is a generic package manager wrapper, not limited to Arch Linux. It interfaces with the underlying system package manager (`apt`, `pacman`, `dnf`, `zypper`, `apk`) to install, remove, or query packages in a unified way.

### `utils.ts`

Contains static utility methods used throughout the codebase for common tasks like file system operations, string manipulation, and system command execution.

### `xdg.ts`

Handles XDG-related configurations, such as setting up autologin, configuring user directories, and managing desktop environment settings.

### `yolk.ts`

Manages a local repository mechanism used to ensure critical packages (like bootloaders) are available during installation, even without an internet connection. It can be configured via `/etc/penguins-eggs.d/yolk.yaml`.
