# Contributing

## Overview

Each integration is a self-contained plugin under `plugins/<domain>/<name>/`. The framework
uses a consistent pattern across all plugins so they are independently testable and replaceable.

## Plugin pattern

Every plugin is a TypeScript class that accepts an injected `exec` function:

```typescript
type ExecFn = (
  cmd: string,
  opts?: { capture?: boolean; echo?: boolean }
) => Promise<{ code: number; data: string; error?: string }>

export class MyPlugin {
  private exec: ExecFn

  constructor(exec: ExecFn) {
    this.exec = exec
  }

  async isAvailable(): Promise<boolean> {
    const result = await this.exec('command -v mytool', { capture: true })
    return result.code === 0
  }
}
```

Injecting `exec` instead of calling `execSync` directly means tests can pass a mock
without spawning real processes. See `test/helpers/mock-exec.ts` for the mock helper.

## Adding a new plugin

1. **Choose a domain** — pick the closest existing domain under `plugins/`, or propose a new
   one if none fits. Current domains: `distribution`, `decentralized`, `config-management`,
   `build-infra`, `dev-workflow`, `packaging`, `security-audit`, `sbom`.

2. **Create the plugin directory**:
   ```
   plugins/<domain>/<plugin-name>/
     <plugin-name>.ts   # main class, exported
     README.md          # usage, config, dependencies
   ```

3. **Implement the class** following the exec-injection pattern above. Export all public
   types alongside the class.

4. **Wire up the src entry point** — add your export to `src/<domain>/index.ts`:
   ```typescript
   export { MyPlugin } from '../../plugins/<domain>/<plugin-name>/<plugin-name>.js'
   export type { MyConfig } from '../../plugins/<domain>/<plugin-name>/<plugin-name>.js'
   ```
   If you are adding a new domain, also create `src/<domain>/index.ts` and add it to
   `src/index.ts` and the `exports` map in `package.json`.

5. **Write tests** in `test/phase<N>/<plugin-name>.test.ts`. Tests must:
   - Use `createMockExec()` from `test/helpers/mock-exec.ts` — no real shell commands
   - Use `createTempDir()` / `cleanTempDir()` from `test/helpers/mock-fs.ts` for temp files
   - Cover: `isAvailable()` true/false, error paths (missing files/tools), exec call
     patterns (correct flags passed), and result shape

6. **Update the catalog** — add a row to the relevant table in `PROJECT-CATALOG.md`.

7. **Update the architecture docs** — add the integration to the domain table in
   `ARCHITECTURE.md` and a spec entry in `INTEGRATION-SPEC.md`.

8. **Run validation**:
   ```bash
   npm run build       # must compile without errors
   npm test            # all tests must pass
   bash test/validate.sh  # structural checks must pass
   ```

## Running tests

```bash
npm test                        # all phases
npm run test:phase7             # phase 7 only (security-audit)
npm run test:phase8             # phase 8 only (sbom)
bash test/validate.sh           # structural validation (no Node required)
```

## Domains and phases

| Domain | Phase | `src/` entry | Plugin dir |
|---|---|---|---|
| Distribution | 1, 6 | `src/distribution/` | `plugins/distribution/` |
| Decentralized | 2 | `src/decentralized/` | `plugins/decentralized/` |
| Config Management | 3 | `src/config-management/` | `plugins/config-management/` |
| Build Infrastructure | 4 | `src/build-infra/` | `plugins/build-infra/` |
| Dev Workflow | 5 | `src/dev-workflow/` | `plugins/dev-workflow/` |
| Packaging | 1 | `src/packaging/` | `plugins/packaging/` |
| Security & Audit | 7 | `src/security-audit/` | `plugins/security-audit/` |
| SBOM & Supply Chain | 8 | `src/sbom/` | `plugins/sbom/` |

## Code style

- TypeScript strict mode — no `any` unless unavoidable, annotate it with a comment
- Match the existing naming conventions: `PascalCase` for classes, `camelCase` for methods
- No `console.log` in plugin code — use `console.warn` or `console.error` for diagnostics
- Shell scripts must have a `#!/usr/bin/env bash` shebang and `set -euo pipefail`

## Upstream projects

All integrations reference external open-source projects. When adding one:
- Link the upstream repo in the plugin `README.md` and `PROJECT-CATALOG.md`
- Note the upstream license
- Do not vendor upstream code — fetch it at runtime (sparse clone, curl, etc.)
