# penguins-powerwash plugin for penguins-immutable-framework

`pif-plugin.sh` is a penguins-powerwash distro plugin that keeps the
immutable framework consistent across factory resets.

| Hook | Trigger | Action |
|---|---|---|
| `pw_plugin_pre_reset` | Before any reset mode | Exits mutable mode if active, so the filesystem is in a clean immutable state before wiping |
| `pw_plugin_post_reset` | After hard/sysprep reset | Re-runs `pif init` with the existing `pif.toml` to restore the immutable backend |

## Registration

```bash
sudo ln -s /usr/share/penguins-immutable-framework/integration/recovery-plugin/pif-plugin.sh \
           /usr/share/penguins-powerwash/plugins/distro/pif-plugin.sh
```

penguins-powerwash auto-loads all `.sh` files from `plugins/distro/` on startup.
