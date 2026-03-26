# penguins-eggs Integration Plugin

Integration hook allowing penguins-eggs to invoke penguins-recovery builders
and embed recovery capabilities into generated live ISOs.

## How it works

penguins-eggs creates live ISOs from running Linux systems. This plugin adds
an optional recovery subsystem to those ISOs by:

1. Including shared rescue scripts from `common/scripts/` in the ISO
2. Adding a recovery boot menu entry (GRUB/syslinux) that launches a
   minimal rescue environment
3. Optionally embedding a recovery partition image for Pop!_OS-style
   refresh/reinstall workflows

## Usage

The plugin is invoked by penguins-eggs during ISO creation when the
`--recovery` flag is passed (planned feature).

```bash
sudo eggs produce --recovery [--recovery-builder=debian|arch|uki]
```

## Files

- `recovery-hook.sh` -- Shell script called by penguins-eggs during ISO build
- `grub-entry.cfg` -- GRUB menu entry template for recovery mode
