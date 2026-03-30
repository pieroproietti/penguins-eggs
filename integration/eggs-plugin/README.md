# penguins-eggs plugin for penguins-powerwash

`powerwash-hook.sh` is called by penguins-eggs during ISO creation.

| `EGGS_HOOK` | Trigger | Action |
|---|---|---|
| `produce` | `eggs produce` | Copies the powerwash binary + libs into the ISO; adds a "Factory Reset" GRUB menu entry |
| `update` | `eggs update` | No-op |

## Registration

```bash
sudo ln -s /usr/share/penguins-powerwash/integration/eggs-plugin/powerwash-hook.sh \
           /usr/share/penguins-eggs/plugins/powerwash-hook.sh
```
