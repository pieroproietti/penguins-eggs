# Recovery Launcher

QML-based fullscreen recovery task launcher. Provides a categorized grid
of recovery operations that invoke scripts from `common/scripts/` and
external tools.

## Task categories

- **Boot Repair** -- GRUB restore, UEFI repair, GRUB config update
- **Disk & Data** -- Disk detection, chroot, GParted, TestDisk, PhotoRec
- **System** -- Password reset, file manager, terminal
- **Network** -- Network settings, web browser

## Running

```bash
# With Qt runtime
./recovery-launcher.sh

# Falls back to terminal menu if no QML runtime is available
```

## Dependencies

- Qt 5.15+ or Qt 6 (qmlscene or qml)
- QtQuick.Controls 2
- Scripts from common/scripts/ installed to /usr/local/bin/

## Integration

The adapter injects this launcher into `/opt/penguins-recovery/gui/`
and creates a desktop entry for autostart.
