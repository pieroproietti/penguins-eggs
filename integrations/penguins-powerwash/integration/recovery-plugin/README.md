# penguins-recovery plugin for penguins-powerwash

`powerwash-plugin.sh` is a penguins-powerwash distro plugin that registers
powerwash itself within the plugin system for post-reset state reporting.

| Hook | Trigger | Action |
|---|---|---|
| `pw_plugin_pre_reset` | Before any reset | No-op (powerwash is the reset tool) |
| `pw_plugin_post_reset` | After any reset | Runs `penguins-powerwash info` to confirm clean state |

## Registration

```bash
sudo ln -s /usr/share/penguins-powerwash/integration/recovery-plugin/powerwash-plugin.sh \
           /usr/share/penguins-powerwash/plugins/distro/powerwash-self-plugin.sh
```
