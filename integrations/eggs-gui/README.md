# eggs-gui

Unified GUI for [penguins-eggs](https://github.com/pieroproietti/penguins-eggs) — a Linux live ISO remastering tool.

Merges three existing projects into one system with a shared Go backend and multiple frontend options:

| Frontend | Framework | Use case |
|----------|-----------|----------|
| **TUI** | [BubbleTea](https://github.com/charmbracelet/bubbletea) (Go) | Terminal power users, SSH sessions |
| **Desktop** | [NodeGUI](https://github.com/nodegui/nodegui) (Qt6/TypeScript) | Native desktop with CSS styling |
| **Web** | [NiceGUI](https://nicegui.io/) (Python) | Remote/headless access via browser |

All frontends connect to a single Go daemon via JSON-RPC over a Unix socket.

## Quick Start

```bash
# Build daemon + TUI
make all

# Run (starts daemon in background, then TUI)
make run
```

## Architecture

```
Frontend (TUI/Desktop/Web)
        │
   JSON-RPC over Unix socket
        │
   eggs-daemon (Go)
        │
   penguins-eggs CLI
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design.

## Features

Merged from [pengui](https://github.com/pieroproietti/pengui), [eggsmaker](https://github.com/pieroproietti/eggsmaker), and [eggsmaker (jlendres fork)](https://github.com/jlendres/eggsmaker):

- Produce ISOs with full option control (prefix, basename, compression, theme, excludes, clone)
- AUTO mode — one-click prepare + produce workflow
- Dad configuration editor (eggs.yaml)
- Tools configuration editor (tools.yaml)
- Wardrobe browser — costumes, accessories, servers
- Calamares installer management
- PPA, Skel, Yolk tools
- ISO copy to USB/directory with progress
- Version display (eggs, calamares, distro)
- i18n support (es, en, pt, it)

## Development

### Prerequisites

- Go 1.22+ (daemon + TUI)
- Node.js 20+ (desktop, optional)
- Python 3.11+ (web, optional)

### Building individual components

```bash
make daemon      # Go backend daemon
make tui         # BubbleTea terminal UI
make desktop     # NodeGUI desktop app (requires: cd desktop && npm install)
make web         # Instructions for web frontend
```

### Running

The daemon must be running for any frontend to work:

```bash
# Terminal 1: start daemon
make run-daemon

# Terminal 2: pick a frontend
make run-tui       # Terminal UI
make run-desktop   # Native desktop
make run-web       # Web UI at http://localhost:8080
```

## Credits

- [pengui](https://github.com/pieroproietti/pengui) by Piero Proietti — PySide6 GUI
- [eggsmaker](https://github.com/pieroproietti/eggsmaker) by Jorge Luis Endres — customtkinter GUI
- [eggsmaker fork](https://github.com/jlendres/eggsmaker) by Jorge Luis Endres — enhanced + web UI

## License

MIT
