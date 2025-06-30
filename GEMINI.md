# Gemini Project Context: penguins-eggs

## Project Overview

`penguins-eggs` is a command-line tool for remastering Debian, Ubuntu, and derivative systems. It allows users to create a live, bootable ISO image of their current system, which can be used for backups, distribution, or creating custom operating system versions. The project is written in TypeScript and built using the oclif framework for CLIs.

## Tech Stack

- **Language:** TypeScript
- **Framework:** [oclif](https://oclif.io/) (for building the CLI)
- **Package Manager:** npm (or pnpm, based on `pnpm-lock.yaml`)
- **Testing:** Mocha (test runner), Chai (assertion library)
- **Linting:** ESLint
- **Formatting:** Prettier

## Key Commands

- **Installation:** `npm install` or `pnpm install`
- **Build:** `npm run build` (compiles TypeScript to JavaScript in `dist/`)
- **Run Tests:** `npm test`
- **Lint Code:** `npm run lint`
- **Run the CLI locally:** `./bin/run [COMMAND]` (e.g., `./bin/run eggs --help`)

## Project Structure

- `src/`: Contains the TypeScript source code for all commands and hooks.
- `dist/`: Contains the compiled JavaScript code (output of the build process).
- `test/`: Contains the Mocha/Chai tests.
- `conf/`: Contains configuration files used by eggs.
- `manpages/`: Man pages for the CLI commands.
- `package.json`: Defines project metadata, dependencies, and scripts.
- `pnpm-lock.yaml`: Indicates that pnpm is the preferred package manager.
