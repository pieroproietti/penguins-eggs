# penguins-eggs plugin for penguins-incus-hub

`pip-hook.sh` is called by penguins-eggs during ISO creation.

| `EGGS_HOOK` | Trigger | Action |
|---|---|---|
| `produce` | `eggs produce` (post) | Copies `penguins-incus-daemon`, `penguins-incus` CLI, bundled profiles, and a systemd unit into the ISO |
| `update` | `eggs update` | Re-embeds if the PIP version has changed |

## Registration

```bash
sudo ln -s /usr/share/penguins-incus-hub/integration/eggs-plugin/pip-hook.sh \
           /usr/share/penguins-eggs/plugins/pip-hook.sh
```

## What gets embedded

| Path in ISO | Source |
|---|---|
| `/usr/local/bin/penguins-incus-daemon` | PIP daemon binary |
| `/usr/local/bin/penguins-incus` | PIP CLI binary |
| `/usr/local/share/penguins-incus-platform/profiles/` | Bundled Incus profiles (16 presets) |
| `/etc/systemd/system/penguins-incus-daemon.service` | Systemd unit for auto-start |
