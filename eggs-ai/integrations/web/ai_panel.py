"""
Eggs-AI panel for the eggs-gui NiceGUI web frontend.

Drop this file into eggs-gui/web/ and import it from main.py:

    from ai_panel import create_ai_panel
    create_ai_panel()

Requires: pip install nicegui httpx
"""

import httpx
from nicegui import ui

EGGS_AI_URL = "http://127.0.0.1:3737"


class AiClient:
    """HTTP client for the eggs-ai API server."""

    def __init__(self, base_url: str = EGGS_AI_URL):
        self.base_url = base_url
        self.session_id = "web-session"

    async def _post(self, path: str, **kwargs) -> str:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{self.base_url}{path}",
                json=kwargs,
                headers={"X-Session-Id": self.session_id},
            )
            resp.raise_for_status()
            return resp.json()["result"]

    async def _get(self, path: str) -> dict:
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

    async def doctor(self, complaint: str = None) -> str:
        return await self._post("/api/doctor", complaint=complaint)

    async def ask(self, question: str) -> str:
        return await self._post("/api/ask", question=question)

    async def build(self, **opts) -> str:
        return await self._post("/api/build", build=opts)

    async def config_explain(self) -> str:
        return await self._post("/api/config/explain")

    async def config_generate(self, purpose: str) -> str:
        return await self._post("/api/config/generate", purpose=purpose)

    async def calamares(self, question: str = None) -> str:
        return await self._post("/api/calamares", question=question)

    async def wardrobe(self, question: str = None) -> str:
        return await self._post("/api/wardrobe", question=question)

    async def chat(self, question: str) -> str:
        return await self._post("/api/chat", question=question)

    async def status(self) -> dict:
        return await self._get("/api/status")

    async def providers(self) -> list:
        data = await self._get("/api/providers")
        return data.get("providers", [])


ai = AiClient()


def create_ai_panel():
    """Create the AI assistant panel in the NiceGUI web UI."""

    with ui.card().classes("w-full"):
        ui.label("Eggs-AI Assistant").classes("text-xl font-bold")

        # Connection status
        status_label = ui.label("Checking connection...")

        async def check_connection():
            if await ai.health():
                status_label.text = "Connected to Eggs-AI"
                status_label.classes(replace="text-green-600")
            else:
                status_label.text = "Eggs-AI not running. Start with: eggs-ai serve"
                status_label.classes(replace="text-red-600")

        ui.timer(0, check_connection, once=True)

        ui.separator()

        # ─── Chat tab ─────────────────────────────────────
        with ui.tabs().classes("w-full") as tabs:
            chat_tab = ui.tab("Chat")
            doctor_tab = ui.tab("Doctor")
            build_tab = ui.tab("Build")
            config_tab = ui.tab("Config")

        with ui.tab_panels(tabs, value=chat_tab).classes("w-full"):

            # Chat panel
            with ui.tab_panel(chat_tab):
                chat_log = ui.column().classes("w-full gap-2")
                chat_input = ui.input(placeholder="Ask about penguins-eggs...").classes("w-full")
                chat_spinner = ui.spinner(size="sm").classes("hidden")

                async def send_chat():
                    question = chat_input.value
                    if not question:
                        return
                    chat_input.value = ""
                    chat_spinner.classes(remove="hidden")

                    with chat_log:
                        ui.label(f"You: {question}").classes("text-blue-600")

                    try:
                        answer = await ai.chat(question)
                        with chat_log:
                            ui.markdown(answer).classes("bg-gray-100 p-2 rounded")
                    except Exception as e:
                        with chat_log:
                            ui.label(f"Error: {e}").classes("text-red-600")
                    finally:
                        chat_spinner.classes(add="hidden")

                chat_input.on("keydown.enter", send_chat)
                ui.button("Send", on_click=send_chat)

            # Doctor panel
            with ui.tab_panel(doctor_tab):
                complaint_input = ui.input(
                    placeholder="Describe the problem (optional)..."
                ).classes("w-full")
                doctor_result = ui.markdown("")
                doctor_spinner = ui.spinner(size="sm").classes("hidden")

                async def run_doctor():
                    doctor_spinner.classes(remove="hidden")
                    doctor_result.content = ""
                    try:
                        result = await ai.doctor(complaint_input.value or None)
                        doctor_result.content = result
                    except Exception as e:
                        doctor_result.content = f"**Error:** {e}"
                    finally:
                        doctor_spinner.classes(add="hidden")

                ui.button("Run Diagnostics", on_click=run_doctor)

            # Build panel
            with ui.tab_panel(build_tab):
                desktop_select = ui.select(
                    ["xfce", "gnome", "kde", "none"],
                    label="Desktop",
                    value="xfce",
                )
                compression_select = ui.select(
                    ["fast", "standard", "max"],
                    label="Compression",
                    value="standard",
                )
                describe_input = ui.input(
                    placeholder="Describe what you want..."
                ).classes("w-full")
                build_result = ui.markdown("")
                build_spinner = ui.spinner(size="sm").classes("hidden")

                async def run_build():
                    build_spinner.classes(remove="hidden")
                    build_result.content = ""
                    try:
                        result = await ai.build(
                            desktop=desktop_select.value,
                            compression=compression_select.value,
                            description=describe_input.value or None,
                        )
                        build_result.content = result
                    except Exception as e:
                        build_result.content = f"**Error:** {e}"
                    finally:
                        build_spinner.classes(add="hidden")

                ui.button("Generate Build Plan", on_click=run_build)

            # Config panel
            with ui.tab_panel(config_tab):
                config_result = ui.markdown("")
                config_spinner = ui.spinner(size="sm").classes("hidden")

                async def explain_config():
                    config_spinner.classes(remove="hidden")
                    config_result.content = ""
                    try:
                        result = await ai.config_explain()
                        config_result.content = result
                    except Exception as e:
                        config_result.content = f"**Error:** {e}"
                    finally:
                        config_spinner.classes(add="hidden")

                purpose_input = ui.input(
                    placeholder="Purpose (e.g., 'minimal rescue USB')..."
                ).classes("w-full")

                async def generate_config():
                    if not purpose_input.value:
                        return
                    config_spinner.classes(remove="hidden")
                    config_result.content = ""
                    try:
                        result = await ai.config_generate(purpose_input.value)
                        config_result.content = result
                    except Exception as e:
                        config_result.content = f"**Error:** {e}"
                    finally:
                        config_spinner.classes(add="hidden")

                with ui.row():
                    ui.button("Explain Current Config", on_click=explain_config)
                    ui.button("Generate Config", on_click=generate_config)
