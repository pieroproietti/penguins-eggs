# eggs-gui — Unified GUI for penguins-eggs

## Overview

`eggs-gui` unifies three existing projects (pengui, eggsmaker, eggsmaker-web) into a
single system with a shared Go backend and multiple frontend options spanning terminal,
desktop, and web interfaces.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTENDS                            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ TUI      │  │ Desktop  │  │ Desktop  │  │ Web        │  │
│  │ BubbleTea│  │ NodeGUI  │  │ Python   │  │ NiceGUI    │  │
│  │ (Go)     │  │ (Qt6/TS) │  │ (ctk/Qt) │  │ (Python)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │             │               │         │
│       └──────────────┴──────┬──────┴───────────────┘         │
│                             │                                │
│                      JSON-RPC / gRPC                         │
│                      over Unix socket                        │
│                             │                                │
├─────────────────────────────┼────────────────────────────────┤
│                             │                                │
│              ┌──────────────▼──────────────┐                 │
│              │     eggs-daemon (Go)        │                 │
│              │                             │                 │
│              │  • Config management        │                 │
│              │  • Command execution        │                 │
│              │  • Process streaming         │                 │
│              │  • Version detection        │                 │
│              │  • ISO management           │                 │
│              │  • Wardrobe management      │                 │
│              │  • i18n                     │                 │
│              │  • Auth (sudo proxy)        │                 │
│              └──────────────┬──────────────┘                 │
│                             │                                │
│              ┌──────────────▼──────────────┐                 │
│              │   penguins-eggs CLI         │                 │
│              │   (system binary)           │                 │
│              └─────────────────────────────┘                 │
│                                                              │
│                        BACKEND                               │
└──────────────────────────────────────────────────────────────┘
```

## Why this architecture?

1. **Single source of truth**: All business logic lives in the Go daemon. No duplicated
   config parsing, command building, or version detection across Python/JS/Go frontends.

2. **Language-appropriate frontends**: Each UI uses the best tool for its context:
   - BubbleTea for terminal power users (Go, zero dependencies)
   - NodeGUI for a native Qt6 desktop app (TypeScript, CSS styling)
   - Python frontends preserved for backward compatibility
   - NiceGUI web UI for remote/headless access

3. **IPC via JSON-RPC over Unix socket**: Simple, language-agnostic protocol. Every
   language has JSON-RPC libraries. Unix sockets avoid network exposure and are fast.

4. **Incremental adoption**: Frontends can be built independently. Start with the Go
   daemon + BubbleTea TUI, then add NodeGUI desktop, then port the web UI.

## Project Structure

```
eggs-gui/
├── daemon/                    # Go backend daemon
│   ├── cmd/
│   │   └── eggs-daemon/       # Daemon entry point
│   ├── internal/
│   │   ├── config/            # eggs.yaml / tools.yaml management
│   │   ├── eggs/              # penguins-eggs command builder & executor
│   │   ├── wardrobe/          # Wardrobe/costume management
│   │   ├── system/            # Version detection, package checks
│   │   ├── iso/               # ISO file management, copy operations
│   │   └── rpc/               # JSON-RPC server & method handlers
│   ├── go.mod
│   └── go.sum
│
├── tui/                       # BubbleTea terminal UI (Go)
│   ├── cmd/
│   │   └── eggs-tui/          # TUI entry point
│   ├── internal/
│   │   ├── app/               # Main Bubble Tea model
│   │   ├── views/             # Phase views (prepare, configure, produce)
│   │   ├── components/        # Reusable Bubble Tea components
│   │   └── client/            # JSON-RPC client to daemon
│   ├── go.mod
│   └── go.sum
│
├── desktop/                   # NodeGUI desktop app (TypeScript)
│   ├── src/
│   │   ├── main.ts            # Entry point
│   │   ├── client.ts          # JSON-RPC client to daemon
│   │   ├── views/             # Qt widget views
│   │   └── components/        # Reusable Qt components
│   ├── package.json
│   └── tsconfig.json
│
├── web/                       # NiceGUI web frontend (Python)
│   ├── main.py                # Web UI entry point
│   ├── backend.py             # JSON-RPC client to daemon
│   ├── requirements.txt
│   └── assets/
│
├── legacy/                    # Preserved original Python frontends
│   ├── pengui/                # Original PySide6 app (adapted to use daemon)
│   └── eggsmaker/             # Original customtkinter app (adapted to use daemon)
│
├── proto/                     # Shared API definitions
│   └── eggs-gui.json          # JSON-RPC method schemas
│
├── assets/                    # Shared icons, images
│   ├── eggs-gui.png
│   ├── eggs-gui.svg
│   └── eggs-gui.desktop
│
├── locales/                   # Shared i18n translations
│   ├── en/
│   ├── es/
│   ├── it/
│   └── pt/
│
├── bin/                       # Build & packaging scripts
│   ├── build-all
│   ├── create-deb
│   └── create-appimage
│
├── Makefile
├── LICENSE
└── README.md
```

## JSON-RPC API (daemon)

The daemon exposes these method groups over a Unix socket at
`/tmp/eggs-gui.sock`:

### Config
- `config.read` → returns eggs.yaml contents
- `config.write` → updates eggs.yaml fields
- `config.readTools` → returns tools.yaml contents
- `config.writeTools` → updates tools.yaml fields

### Eggs Commands
- `eggs.dad` → run `eggs dad` with options
- `eggs.produce` → run `eggs produce` with options (streams output)
- `eggs.kill` → run `eggs kill`
- `eggs.status` → run `eggs status`
- `eggs.cuckoo` → run `eggs cuckoo`

### Calamares
- `calamares.install` → install calamares
- `calamares.remove` → remove calamares

### Tools
- `tools.clean` → run `eggs tools clean`
- `tools.ppa.add` → add penguins-eggs PPA
- `tools.ppa.remove` → remove penguins-eggs PPA
- `tools.skel` → run `eggs tools skel`
- `tools.yolk` → run `eggs tools yolk`

### Wardrobe
- `wardrobe.get` → download wardrobe
- `wardrobe.list` → list costumes/accessories/servers
- `wardrobe.show` → show costume details
- `wardrobe.wear` → apply a costume

### System
- `system.versions` → returns eggs, calamares, distro versions
- `system.checkDeps` → verify penguins-eggs is installed
- `system.sudoAuth` → authenticate sudo password

### ISO
- `iso.list` → list generated ISOs
- `iso.copy` → copy ISO to destination (streams progress)
- `iso.size` → get ISO file size

### Streaming
Commands that produce output (produce, copy, etc.) use JSON-RPC notifications
to stream stdout/stderr lines back to the client in real time:

```json
{"jsonrpc": "2.0", "method": "stream.output", "params": {"id": "task-123", "line": "Copying filesystem...", "progress": 45}}
```

## Implementation Phases

### Phase 1: Go daemon + BubbleTea TUI
- Implement daemon with config, eggs commands, system checks
- Build BubbleTea TUI with phased workflow (matching eggsmaker's UX)
- Add wardrobe features from pengui
- Single binary: `eggs-gui` (daemon embedded, starts automatically)

### Phase 2: NodeGUI desktop
- TypeScript desktop app using Qt6 via NodeGUI
- CSS-styled native widgets
- Connects to daemon via JSON-RPC

### Phase 3: Web UI migration
- Port NiceGUI web frontend to use daemon instead of direct subprocess calls
- Preserve existing web UI design

### Phase 4: Legacy frontend adapters
- Thin JSON-RPC client wrappers for pengui and eggsmaker
- Allows existing Python UIs to work with the new daemon

## Feature Matrix (merged from all projects)

| Feature                    | pengui | eggsmaker | eggsmaker-jl | eggs-gui |
|----------------------------|--------|-----------|--------------|----------|
| Produce ISO                | ✅     | ✅        | ✅           | ✅       |
| Kill ISOs                  | ✅     | ✅        | ✅           | ✅       |
| Dad config                 | ✅     | ✅        | ✅           | ✅       |
| Tools config editor        | ✅     | ❌        | ❌           | ✅       |
| Wardrobe browser           | ✅     | ❌        | ❌           | ✅       |
| Wardrobe wear              | ✅     | ❌        | ❌           | ✅       |
| Calamares install/remove   | ✅     | ❌        | ✅           | ✅       |
| PPA management             | ✅     | ❌        | ❌           | ✅       |
| Skel/Yolk tools            | ✅     | ❌        | ❌           | ✅       |
| AUTO mode (one-click)      | ❌     | ❌        | ✅           | ✅       |
| Progress bars + timers     | ❌     | ✅        | ✅           | ✅       |
| ISO copy to USB/dir        | ❌     | ✅        | ✅           | ✅       |
| Version display            | ❌     | ✅        | ✅           | ✅       |
| i18n (es/en/pt/it)         | ❌     | ✅        | ✅           | ✅       |
| Terminal TUI               | ❌     | ❌        | ❌           | ✅       |
| Web UI                     | ❌     | ❌        | ✅           | ✅       |
| Native desktop (Qt6)       | ✅     | ❌        | ❌           | ✅       |
| Edit eggs.yaml in GUI      | ✅     | ✅        | ✅           | ✅       |
| Text editor widget         | ✅     | ❌        | ❌           | ✅       |
| Clone/CryptedClone options | ✅     | ❌        | ✅           | ✅       |

## Credits

- **pengui**: Piero Proietti (PySide6 GUI)
- **eggsmaker**: Jorge Luis Endres (customtkinter GUI)
- **eggsmaker fork**: Jorge Luis Endres + Piero Proietti (enhanced + web UI)
- **eggs-gui**: Unified project merging all three
