---
name: New plugin proposal
about: Propose adding a new upstream project as an integration plugin
labels: plugin-proposal
---

## Upstream project

**URL:** <!-- e.g. https://github.com/org/project -->
**License:** <!-- e.g. MIT, Apache-2.0 -->
**Language:** <!-- e.g. Go, Python, Shell -->

## Proposed domain

<!-- Which domain does this fit into? -->
<!-- distribution / decentralized / config-management / build-infra / dev-workflow / packaging / security-audit / sbom -->

## What it does

<!-- One or two sentences describing what the upstream project does. -->

## How it integrates with penguins-eggs

<!-- Describe the integration point: which eggs command or lifecycle hook would use it,
     what flag or subcommand would expose it, and what the user experience looks like. -->

```bash
# Example usage
eggs produce --<flag>
eggs <subcommand> <args>
```

## Why it belongs here

<!-- Why is this a good fit for penguins-eggs-audit specifically?
     What gap does it fill that existing plugins don't cover? -->

## Dependencies

<!-- What does the user need to install separately for this plugin to work? -->
