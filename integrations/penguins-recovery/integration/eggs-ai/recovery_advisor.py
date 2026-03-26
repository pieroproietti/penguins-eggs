"""
integration/eggs-ai/recovery_advisor.py

AI-assisted recovery advisor for the penguins-recovery GUI (KDE/QML launcher).

Drop this file into the recovery-launcher Python layer and call
create_advisor_panel() to embed an AI assistant tab in the recovery UI.

Requires: pip install httpx  (or: apt install python3-httpx)
Connects to the eggs-ai HTTP API at http://127.0.0.1:3737.

The panel is intentionally minimal — it surfaces Doctor and Ask, the two
endpoints most useful in a recovery context. The full eggs-ai panel
(build, config, wardrobe) lives in integrations/eggs-ai/integrations/web/.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from typing import Optional

EGGS_AI_URL = os.environ.get("EGGS_AI_URL", "http://127.0.0.1:3737")
_SESSION_ID = f"recovery-{os.getpid()}"


# ── HTTP client ───────────────────────────────────────────────────────────────

class RecoveryAiClient:
    """Minimal async HTTP client for the eggs-ai API."""

    def __init__(self, base_url: str = EGGS_AI_URL) -> None:
        self.base_url = base_url

    async def _post(self, path: str, **kwargs) -> str:
        try:
            import httpx
        except ImportError:
            raise RuntimeError(
                "httpx is required: pip install httpx  or  apt install python3-httpx"
            )
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{self.base_url}{path}",
                json={k: v for k, v in kwargs.items() if v is not None},
                headers={"X-Session-Id": _SESSION_ID},
            )
            resp.raise_for_status()
            return resp.json().get("result", "")

    async def _get(self, path: str) -> dict:
        try:
            import httpx
        except ImportError:
            raise RuntimeError("httpx is required")
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{self.base_url}{path}")
            resp.raise_for_status()
            return resp.json()

    async def health(self) -> bool:
        try:
            data = await self._get("/api/health")
            return data.get("status") == "ok"
        except Exception:
            return False

    async def doctor(self, complaint: Optional[str] = None) -> str:
        return await self._post("/api/doctor", complaint=complaint)

    async def ask(self, question: str) -> str:
        return await self._post("/api/ask", question=question)

    async def status(self) -> dict:
        return await self._get("/api/status")


# ── NiceGUI panel (optional — only used when eggs-gui web UI is present) ─────

def create_advisor_panel() -> None:
    """
    Create a minimal AI advisor panel for the NiceGUI recovery web UI.

    Import and call this from the recovery web UI's main.py:

        from recovery_advisor import create_advisor_panel
        create_advisor_panel()
    """
    try:
        from nicegui import ui
    except ImportError:
        return  # NiceGUI not available in this recovery environment

    ai = RecoveryAiClient()

    with ui.card().classes("w-full"):
        ui.label("Recovery AI Advisor").classes("text-xl font-bold")
        status_label = ui.label("Checking connection...")

        async def check_connection() -> None:
            if await ai.health():
                status_label.set_text("Connected to eggs-ai")
                status_label.classes(replace="text-green-600")
            else:
                status_label.set_text(
                    "eggs-ai not running. Start with: eggs-ai serve"
                )
                status_label.classes(replace="text-red-600")

        ui.timer(0, check_connection, once=True)
        ui.separator()

        with ui.tabs().classes("w-full") as tabs:
            doctor_tab = ui.tab("Doctor")
            ask_tab = ui.tab("Ask")

        with ui.tab_panels(tabs, value=doctor_tab).classes("w-full"):

            # Doctor panel
            with ui.tab_panel(doctor_tab):
                complaint_input = ui.input(
                    placeholder="Describe the problem (optional)..."
                ).classes("w-full")
                doctor_result = ui.markdown("")
                doctor_spinner = ui.spinner(size="sm").classes("hidden")

                async def run_doctor() -> None:
                    doctor_spinner.classes(remove="hidden")
                    doctor_result.content = ""
                    try:
                        result = await ai.doctor(complaint_input.value or None)
                        doctor_result.content = result
                    except Exception as exc:
                        doctor_result.content = f"**Error:** {exc}"
                    finally:
                        doctor_spinner.classes(add="hidden")

                ui.button("Run Diagnostics", on_click=run_doctor)

            # Ask panel
            with ui.tab_panel(ask_tab):
                ask_input = ui.input(
                    placeholder="Ask about recovery, GRUB, partitions..."
                ).classes("w-full")
                ask_result = ui.markdown("")
                ask_spinner = ui.spinner(size="sm").classes("hidden")

                async def run_ask() -> None:
                    if not ask_input.value:
                        return
                    ask_spinner.classes(remove="hidden")
                    ask_result.content = ""
                    try:
                        result = await ai.ask(ask_input.value)
                        ask_result.content = result
                    except Exception as exc:
                        ask_result.content = f"**Error:** {exc}"
                    finally:
                        ask_spinner.classes(add="hidden")

                ask_input.on("keydown.enter", run_ask)
                ui.button("Ask", on_click=run_ask)


# ── CLI fallback (for recovery shells without a GUI) ─────────────────────────

async def _cli_main() -> None:
    ai = RecoveryAiClient()

    if not await ai.health():
        print(f"eggs-ai is not running at {EGGS_AI_URL}.", file=sys.stderr)
        print("Start it with: eggs-ai serve", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1] if len(sys.argv) > 1 else "doctor"
    arg = sys.argv[2] if len(sys.argv) > 2 else None

    if command == "doctor":
        print(await ai.doctor(arg))
    elif command == "ask":
        if not arg:
            print("Usage: recovery_advisor.py ask <question>", file=sys.stderr)
            sys.exit(1)
        print(await ai.ask(arg))
    elif command == "status":
        print(json.dumps(await ai.status(), indent=2))
    else:
        print(f"Unknown command: {command}. Use: doctor, ask, status", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(_cli_main())
