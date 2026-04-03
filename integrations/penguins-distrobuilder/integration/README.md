# penguins-distrobuilder integration

## eggs-plugin

`eggs-plugin/distrobuilder-hook.sh` is called by `eggs produce` after ISO
creation. When enabled, it builds a distrobuilder LXC/Incus image of the
produced system for container distribution alongside the standard ISO.

**Configuration** (`/etc/penguins-distrobuilder/eggs-hooks.conf`):

```sh
DISTROBUILDER_ENABLED=1
DISTROBUILDER_TEMPLATE=/path/to/template.yaml
DISTROBUILDER_TYPE=incus          # incus | lxc
DISTROBUILDER_OUTPUT=/var/lib/eggs/distrobuilder
```

## recovery-plugin

`recovery-plugin/distrobuilder-recovery-hook.sh` is called by
penguins-recovery before a factory reset. It snapshots the current rootfs
via `distrobuilder pack-incus` (or `pack-lxc`) so the container state can
be restored after the reset.

**Configuration** (`/etc/penguins-distrobuilder/eggs-hooks.conf`):

```sh
DISTROBUILDER_RECOVERY_ENABLED=1
DISTROBUILDER_RECOVERY_ROOTFS=/
DISTROBUILDER_RECOVERY_OUTPUT=/var/lib/eggs/distrobuilder/recovery
```
