# Touch Profile

Extends the plasma-nano base with touch-friendly components from
[KDE/plasma-mobile](https://invent.kde.org/plasma/plasma-mobile).

Adds ~100-150MB to the base image.

## Cherry-picked components

- `quicksettings/` -- WiFi, Bluetooth, battery, audio, screenshot,
  flashlight, power menu, night color, caffeine toggles
- `homescreen/` -- Halcyon and Folio touch homescreens

## Usage

```bash
sudo make adapt INPUT=naked.iso GUI=touch
```
