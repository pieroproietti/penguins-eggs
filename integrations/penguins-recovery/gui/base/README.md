# GUI Base (plasma-nano)

Minimal Plasma shell package from [KDE/plasma-nano](https://invent.kde.org/plasma/plasma-nano).
Used as the foundation for all recovery GUI profiles.

Plasma Nano provides a single-app kiosk-style shell with minimal resource
usage (~150-300MB RAM, 3-8s boot). The recovery-launcher QML app runs as
the primary fullscreen application.

## Contents

- `shell/` -- Plasma shell package (containment, layout, views)
- `components/` -- C++ components (startup notifier, fullscreen overlay)
- `CMakeLists.txt` -- Build configuration
- `LICENSES/` -- KDE license files

## License

LGPL-2.0-or-later / GPL-2.0-or-later (KDE dual license)
