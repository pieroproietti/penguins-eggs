# eggs-ai recovery advisor integration

Connects the penguins-recovery environment to the [eggs-ai](https://github.com/Interested-Deving-1896/eggs-ai) HTTP API, giving users AI-assisted diagnostics and Q&A from inside a recovery session.

## What it is

Two drop-in files:

| File | Use case |
|---|---|
| `recovery-advisor.sh` | Shell script — works in any recovery terminal, requires only `curl` or `wget` |
| `recovery_advisor.py` | Python module — CLI fallback + optional NiceGUI panel for the recovery web UI |

Both connect to the eggs-ai HTTP API at `http://127.0.0.1:3737` (configurable via `EGGS_AI_URL`).

## Why eggs-ai in a recovery environment?

The recovery environment runs *after* something has gone wrong. Users are often non-technical and don't know which recovery tool to reach for. The AI advisor surfaces the right next step:

- `doctor` — inspects the system and diagnoses the problem
- `ask` — answers specific questions ("how do I reset GRUB?", "my /etc/fstab is broken")

This is distinct from the eggs-ai integration in `eggs-gui` (which is about *producing* ISOs). Here the context is *repairing* an installed system.

## Usage

### Shell (recovery terminal)

```bash
# Copy into the recovery ISO
cp recovery-advisor.sh /usr/local/bin/recovery-advisor
chmod +x /usr/local/bin/recovery-advisor

# Run from a recovery shell
recovery-advisor doctor "system won't boot after kernel update"
recovery-advisor ask "how do I repair a broken GRUB installation?"
recovery-advisor status
```

### Python CLI

```bash
python3 recovery_advisor.py doctor "disk not found at boot"
python3 recovery_advisor.py ask "what does error code 0x000000ED mean?"
```

### NiceGUI panel (recovery web UI)

```python
# In the recovery web UI's main.py:
from recovery_advisor import create_advisor_panel
create_advisor_panel()
```

## Requirements

- eggs-ai must be running: `eggs-ai serve`
- Shell script: `curl` or `wget`
- Python module: `httpx` (`pip install httpx` or `apt install python3-httpx`)
- NiceGUI panel: additionally `nicegui` (`pip install nicegui`)

## Relationship to other eggs-ai integrations

| Integration | Location | Purpose |
|---|---|---|
| TUI client | `eggs-ai/integrations/tui/ai_client.go` | AI features in eggs-gui BubbleTea TUI |
| Web panel | `eggs-ai/integrations/web/ai_panel.py` | Full AI panel in eggs-gui NiceGUI web UI |
| Recovery advisor | `penguins-recovery/integration/eggs-ai/` | AI diagnostics inside a recovery session |

The recovery advisor intentionally exposes only `doctor` and `ask` — the two endpoints relevant to a broken system. The full eggs-ai panel (build, config, wardrobe) is not useful in a recovery context.
