# penguins-eggs plugin for penguins-immutable-framework

`pif-hook.sh` is called by penguins-eggs and by pif's Go hooks package.

| `EGGS_HOOK` | Trigger | Action |
|---|---|---|
| `produce` | `eggs produce` | Embeds active `pif.toml` and `pif status --json` into the ISO at `/etc/penguins-immutable-framework/` |
| `update` | `eggs update` | Aborts if the system is currently in mutable mode |
| `pif-upgraded` | pif post-upgrade | Logs that the next ISO build will reflect the new immutable root |
| `pif-mutable-enter` | `pif mutable enter` | Warns that ISO builds should be deferred |
| `pif-mutable-exit` | `pif mutable exit` | Confirms immutability restored |

## Registration

```bash
sudo ln -s /usr/share/penguins-immutable-framework/integration/eggs-plugin/pif-hook.sh \
           /usr/share/penguins-eggs/plugins/pif-hook.sh
```
