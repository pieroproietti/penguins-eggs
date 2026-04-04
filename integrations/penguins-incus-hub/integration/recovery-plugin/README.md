# penguins-recovery plugin for penguins-incus-hub

`pip-recovery-plugin.sh` is called by penguins-recovery before and after
factory resets.

| Hook | Trigger | Action |
|---|---|---|
| `pre-reset` | Any powerwash mode | Snapshots all running Incus containers and VMs |
| `post-hard-reset` | `hard` or `sysprep` mode | Restarts `penguins-incus-daemon`; re-applies default profiles |

## Registration

```bash
sudo ln -s /usr/share/penguins-incus-hub/integration/recovery-plugin/pip-recovery-plugin.sh \
           /usr/share/penguins-recovery/plugins/pip-recovery-plugin.sh
```
