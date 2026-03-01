# Development Workflow Plugins

CI/CD, security scanning, automation, and developer tools.

## Plugins

| Plugin | Project | Status |
|---|---|---|
| pr-automation | linear-b/gitstream | Planned |
| security-scan | jfrog/frogbot | Planned |
| ts-ci | github-actions-workflow-ts | Planned |
| dev-tools | lazygit, git-insight, git-swift | Planned |

## pr-automation

gitStream rules for the eggs repo. Auto-label PRs by path, auto-assign
distro maintainers, auto-merge docs-only PRs.

## security-scan

Frogbot scans eggs npm dependencies for CVEs. Comments on PRs with
vulnerability reports. Creates fix PRs.

## ts-ci

Define eggs CI/CD pipelines in TypeScript using github-actions-workflow-ts.
Compile to standard GitHub Actions YAML. Type-safe workflow definitions.

Also evaluated: fluent-github-actions (Deno), github-actions-workflow-builder.

## dev-tools

Wardrobe costume that includes lazygit, git-insight, and git-swift for
developer-focused eggs distros.
