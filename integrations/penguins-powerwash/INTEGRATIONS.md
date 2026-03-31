# penguins-powerwash integrations

External projects and ecosystem tools integrated into penguins-powerwash.

## penguins ecosystem (bidirectional)

| Direction | Tool | Hook point | Action |
|---|---|---|---|
| powerwash → recovery | [penguins-recovery](https://github.com/Interested-Deving-1896/penguins-recovery) | Pre-reset (any mode) | `penguins-recovery snapshot create pre-powerwash-<mode>` |
| powerwash → eggs | [penguins-eggs](https://github.com/Interested-Deving-1896/penguins-eggs) | Pre-reset (optional) | `eggs produce --naked` to snapshot live state before wipe |
| powerwash → recovery | penguins-recovery | Post-reset (hard/sysprep) | `penguins-recovery adapter.sh` to re-layer recovery tools |
| powerwash → eggs | penguins-eggs | Post-backup | Records backup path for next ISO manifest |
| eggs → powerwash | penguins-eggs | `eggs produce` | Embeds powerwash binary + libs into ISO; adds GRUB factory-reset entry |
| recovery → powerwash | penguins-powerwash plugin system | Post-reset | Runs `penguins-powerwash info` to confirm clean state |
| pkm → powerwash | [penguins-kernel-manager](https://github.com/Interested-Deving-1896/penguins-kernel-manager) | Post-reset | Reinstalls held kernels after hard reset via `pkm-plugin.sh` |
| pif → powerwash | [penguins-immutable-framework](https://github.com/Interested-Deving-1896/penguins-immutable-framework) | Pre-reset | Exits mutable mode before reset via `pif-plugin.sh` |

### Integration files

| File | Purpose |
|---|---|
| `lib/eggs-hooks.sh` | Outbound hook functions sourced by the main entrypoint |
| `integration/eggs-plugin/powerwash-hook.sh` | Called by `eggs produce` to embed powerwash into the ISO |
| `integration/recovery-plugin/powerwash-plugin.sh` | Registered as a powerwash distro plugin for post-reset state reporting |

### Configuration

`/etc/penguins-powerwash/eggs-hooks.conf`:

```bash
EGGS_BIN="/usr/bin/eggs"
RECOVERY_BIN="/usr/bin/penguins-recovery"
PRE_RESET_SNAPSHOT=1       # create recovery snapshot before reset
PRE_RESET_EGGS_PRODUCE=0   # produce naked ISO before reset (slow)
POST_HARD_RESET_ADAPT=1    # re-layer recovery tools after hard/sysprep reset
```

### Registration

```bash
# Register eggs plugin
sudo ln -sf /usr/share/penguins-powerwash/integration/eggs-plugin/powerwash-hook.sh \
            /usr/share/penguins-eggs/plugins/powerwash-hook.sh

# Register recovery plugin (self-reporting)
sudo ln -sf /usr/share/penguins-powerwash/integration/recovery-plugin/powerwash-plugin.sh \
            /usr/share/penguins-powerwash/plugins/distro/powerwash-self-plugin.sh

# Or use the Makefile target (handles both):
sudo make install-integration
```

---

## Plugin system

penguins-powerwash has its own plugin system (`lib/plugin.sh`) that third-party
tools use to hook into reset operations.

| Plugin type | Directory | Match field | Hooks |
|---|---|---|---|
| `distro` | `plugins/distro/` | Regex on distro ID | `pw_plugin_pre_reset`, `pw_plugin_post_reset` |
| `filesystem` | `plugins/filesystem/` | Regex on filesystem type | `pw_plugin_pre_reset`, `pw_plugin_post_reset` |
| `hardware` | `plugins/hardware/` | Regex on DMI product name | `pw_plugin_pre_reset`, `pw_plugin_post_reset` |

Plugins from the penguins ecosystem that register here:

| Plugin file | Registered by | Purpose |
|---|---|---|
| `plugins/distro/pkm-plugin.sh` | penguins-kernel-manager `make install-integration` | Save/restore held kernels across resets |
| `plugins/distro/pif-plugin.sh` | penguins-immutable-framework `make install-integration` | Exit mutable mode pre-reset; re-init backend post-reset |

---

## Reset mode reference

| Mode | What is wiped | Typical use |
|---|---|---|
| `soft` | User dotfiles | Personal config reset |
| `medium` | Dotfiles + packages | Return to base install |
| `hard` | Dotfiles + packages + home data | Full factory reset |
| `sysprep` | Machine identity (ID, SSH keys, hostname) | Prepare image for cloning |
| `hardware` | Partition table + filesystem | Bare-metal re-image |
