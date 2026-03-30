# penguins-powerwash plugin for penguins-kernel-manager

`pkm-plugin.sh` is a penguins-powerwash distro plugin that preserves and
restores kernel state across factory resets.

| Hook | Trigger | Action |
|---|---|---|
| `pw_plugin_pre_reset` | Before any reset mode | Saves installed/held kernel list to `/var/lib/powerwash/pkm-kernel-state.json` |
| `pw_plugin_post_reset` | After hard/medium reset | Reinstalls kernels that were held before the reset |

## Registration

Copy or symlink into the penguins-powerwash distro plugin directory:

```bash
sudo ln -s /usr/share/penguins-kernel-manager/integration/recovery-plugin/pkm-plugin.sh \
           /usr/share/penguins-powerwash/plugins/distro/pkm-plugin.sh
```

penguins-powerwash auto-loads all `.sh` files from `plugins/distro/` on startup.
