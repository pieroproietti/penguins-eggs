# linux-suite

Bundles [Nerds489/ultimate-linux-suite](https://github.com/Nerds489/ultimate-linux-suite)
into eggs costumes. Provides a unified CLI for Linux install, configuration, and hardening.

## Usage

```bash
# Add to a costume
eggs costume --include linux-suite

# Fetch/update upstream suite
eggs suite fetch

# Run interactively (for testing)
unified --help
unified install <package>
unified harden
```

## What gets installed

- `unified` binary at `/usr/local/bin/unified`
- Supports: install, configure, harden, dry-run, auto-confirm modes

## Dependencies

- `bash` 4+
- Internet access during `eggs suite fetch`
