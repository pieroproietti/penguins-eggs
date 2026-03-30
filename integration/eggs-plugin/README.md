# penguins-eggs plugin for penguins-kernel-manager

`pkm-hook.sh` is called by penguins-eggs at three hook points:

| `EGGS_HOOK` | Trigger | Action |
|---|---|---|
| `produce` | `eggs produce` | Writes a JSON kernel manifest into the ISO at `/etc/penguins-kernel-manager/kernel-manifest.json` |
| `update` | `eggs update` | Warns if held kernels would be skipped |
| `kernel-changed` | pkm post-install | Logs that the next ISO build will include the new kernel |

## Registration

Copy or symlink `pkm-hook.sh` into the penguins-eggs plugin directory:

```bash
sudo ln -s /usr/share/penguins-kernel-manager/integration/eggs-plugin/pkm-hook.sh \
           /usr/share/penguins-eggs/plugins/pkm-hook.sh
```

Or invoke it directly from a custom `eggs` hook script by setting `EGGS_HOOK`
and calling the script.
