# Full Profile

Extends the plasma-nano base with desktop components from
[KDE/plasma-desktop](https://invent.kde.org/plasma/plasma-desktop).

Adds ~200-300MB to the base image. Provides a familiar desktop experience
with taskbar, app launcher, and USB auto-mounting.

## Cherry-picked components

- `panel/` -- Desktop taskbar containment
- `launcher/` -- Kicker app launcher (start menu)
- `automounter/` -- Solid device automounter (auto-mount USB drives)

## Usage

```bash
sudo make adapt INPUT=naked.iso GUI=full
```
