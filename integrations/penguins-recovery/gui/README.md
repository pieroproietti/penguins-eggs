# GUI System

Profile-based graphical recovery environment built on KDE Plasma.

## Architecture

Uses **plasma-nano** as the minimal base shell, with optional components
cherry-picked from plasma-mobile and plasma-desktop for touch and full
desktop profiles.

```
gui/
├── base/                    # plasma-nano (always included)
├── profiles/
│   ├── minimal/             # Nano only -- kiosk-style single launcher
│   ├── touch/               # Nano + mobile quick settings + touch gestures
│   └── full/                # Nano + desktop taskbar + system tray
└── recovery-launcher/       # QML recovery task launcher app
```

## Profiles

| Profile | Shell | RAM | Boot | Input | Use case |
|---------|-------|-----|------|-------|----------|
| minimal | plasma-nano | ~200MB | ~5s | Keyboard | Servers, low-RAM systems |
| touch | plasma-nano + mobile | ~400MB | ~10s | Touch + keyboard | Tablets, touchscreen laptops |
| full | plasma-desktop | ~800MB | ~15s | Mouse + keyboard | Desktop/laptop recovery |

## Recovery Launcher

The recovery-launcher is a QML app that presents a categorized grid of
recovery tasks. It works across all profiles and falls back to a terminal
menu if no Qt runtime is available.

## Sources

- base/: [KDE/plasma-nano](https://invent.kde.org/plasma/plasma-nano)
- profiles/touch/: [KDE/plasma-mobile](https://invent.kde.org/plasma/plasma-mobile)
- profiles/full/: [KDE/plasma-desktop](https://invent.kde.org/plasma/plasma-desktop)
