"""eggs-gui web frontend using NiceGUI, backed by the Go daemon."""

import os
from nicegui import ui

from daemon_client import DaemonClient

# Theme colors matching eggsmaker
COLORS = {
    "bg": "#23272e",
    "panel": "#000000",
    "button": "#0E48C5",
    "button_hover": "#1741a6",
    "orange": "#FD8637",
    "terminal_bg": "#0e1010",
    "terminal_text": "#87CEFA",
    "light_blue": "#00BFFF",
    "success": "#39ee39",
    "error": "#ff0000",
}


def create_ui():
    client = DaemonClient()
    try:
        client.connect()
    except Exception:
        ui.label("Cannot connect to eggs-gui daemon. Start it with: eggs-daemon").style(
            "color: red; font-size: 20px"
        )
        return

    # Fetch initial data
    try:
        versions = client.call("system.versions")
    except Exception:
        versions = {"eggs": "N/A", "calamares": "N/A", "distro": "N/A"}

    # Page styling
    ui.query("body").style(f"background-color: {COLORS['bg']}")

    # Header
    with ui.row().classes("w-full items-center justify-between p-4"):
        ui.label("eggs-gui").style(
            f"color: {COLORS['light_blue']}; font-size: 24px; font-weight: bold"
        )
        ui.label(
            f"Eggs: {versions.get('eggs', 'N/A')} | "
            f"Calamares: {versions.get('calamares', 'N/A')} | "
            f"{versions.get('distro', '')}"
        ).style("color: white; font-size: 14px")

    # Terminal output
    log = ui.log(max_lines=200).style(
        f"background-color: {COLORS['terminal_bg']}; "
        f"color: {COLORS['terminal_text']}; "
        "font-family: 'JetBrains Mono', monospace; "
        "height: 300px; width: 100%; border-radius: 10px"
    )
    log.push("Ready.")

    # Tabs
    with ui.tabs().classes("w-full") as tabs:
        main_tab = ui.tab("Main")
        wardrobe_tab = ui.tab("Wardrobe")
        config_tab = ui.tab("Config")
        tools_tab = ui.tab("Tools")

    with ui.tab_panels(tabs, value=main_tab).classes("w-full"):
        # Main tab
        with ui.tab_panel(main_tab):
            with ui.row().classes("w-full gap-4"):
                # Phase 1
                with ui.card().style(
                    f"background-color: {COLORS['panel']}; border: 1px solid #444C5E"
                ):
                    ui.label("Phase 1: Prepare").style(
                        f"color: {COLORS['light_blue']}; font-weight: bold; font-size: 16px"
                    )

                    async def run_prepare():
                        log.push("\n=== Phase 1: Prepare ===")
                        try:
                            client.call_stream(
                                "eggs.dad",
                                {"default": True},
                                on_line=lambda line: log.push(line),
                            )
                            log.push("Preparation complete.")
                        except Exception as e:
                            log.push(f"Error: {e}")

                    ui.button("Prepare", on_click=run_prepare).style(
                        f"background-color: {COLORS['button']}"
                    )

                # Phase 3
                with ui.card().style(
                    f"background-color: {COLORS['panel']}; border: 1px solid #444C5E"
                ):
                    ui.label("Phase 3: Produce").style(
                        f"color: {COLORS['light_blue']}; font-weight: bold; font-size: 16px"
                    )
                    max_comp = ui.switch("Max compression")
                    include_data = ui.switch("Include data")

                    async def run_produce():
                        log.push("\n=== Phase 3: Produce ISO ===")
                        opts = {}
                        if max_comp.value:
                            opts["compression"] = "max"
                        try:
                            client.call_stream(
                                "eggs.produce",
                                opts,
                                on_line=lambda line: log.push(line),
                            )
                            log.push("ISO produced.")
                        except Exception as e:
                            log.push(f"Error: {e}")

                    ui.button("Produce", on_click=run_produce).style(
                        f"background-color: {COLORS['button']}"
                    )

                # AUTO
                with ui.card().style(
                    f"background-color: {COLORS['panel']}; border: 1px solid #444C5E"
                ):
                    ui.label("AUTO").style(
                        f"color: {COLORS['orange']}; font-weight: bold; font-size: 20px"
                    )

                    async def run_auto():
                        log.push("\n=== AUTO MODE ===")
                        try:
                            log.push("\n--- Killing old ISOs ---")
                            client.call_stream(
                                "eggs.kill", {}, on_line=lambda l: log.push(l)
                            )
                            log.push("\n--- Cleaning ---")
                            client.call_stream(
                                "tools.clean", {}, on_line=lambda l: log.push(l)
                            )
                            log.push("\n--- Preparing ---")
                            client.call_stream(
                                "eggs.dad",
                                {"default": True},
                                on_line=lambda l: log.push(l),
                            )
                            log.push("\n--- Producing ISO ---")
                            client.call_stream(
                                "eggs.produce", {}, on_line=lambda l: log.push(l)
                            )
                            log.push("\nAUTO mode complete.")
                        except Exception as e:
                            log.push(f"Error: {e}")

                    ui.button("Run AUTO", on_click=run_auto).style(
                        "background-color: #006400; font-size: 18px; font-weight: bold; "
                        "min-width: 200px; min-height: 60px"
                    )

            # Kill button
            with ui.row().classes("w-full mt-4"):

                async def run_kill():
                    log.push("\n=== Killing ISOs ===")
                    try:
                        client.call_stream(
                            "eggs.kill", {}, on_line=lambda l: log.push(l)
                        )
                        log.push("ISOs killed.")
                    except Exception as e:
                        log.push(f"Error: {e}")

                ui.button("Kill ISOs", on_click=run_kill).style(
                    "background-color: #ff052b"
                )

        # Wardrobe tab
        with ui.tab_panel(wardrobe_tab):
            ui.label("Wardrobe").style(
                f"color: {COLORS['light_blue']}; font-weight: bold; font-size: 18px"
            )

            async def load_wardrobe():
                try:
                    contents = client.call("wardrobe.list")
                    wardrobe_output.set_text(
                        f"Costumes: {', '.join(contents.get('costumes', []))}\n"
                        f"Accessories: {', '.join(contents.get('accessories', []))}\n"
                        f"Servers: {', '.join(contents.get('servers', []))}"
                    )
                except Exception as e:
                    wardrobe_output.set_text(f"Error: {e}")

            ui.button("Load Wardrobe", on_click=load_wardrobe).style(
                f"background-color: {COLORS['button']}"
            )
            wardrobe_output = ui.label("").style("color: white; white-space: pre")

        # Config tab
        with ui.tab_panel(config_tab):
            ui.label("Configuration").style(
                f"color: {COLORS['light_blue']}; font-weight: bold; font-size: 18px"
            )

            async def load_config():
                try:
                    cfg = client.call("config.read")
                    import json

                    config_editor.set_value(json.dumps(cfg, indent=2))
                except Exception as e:
                    config_editor.set_value(f"Error: {e}")

            ui.button("Load Config", on_click=load_config).style(
                f"background-color: {COLORS['button']}"
            )
            config_editor = ui.textarea("eggs.yaml").style(
                f"background-color: {COLORS['terminal_bg']}; color: white; "
                "font-family: monospace; width: 100%; min-height: 400px"
            )

        # Tools tab
        with ui.tab_panel(tools_tab):
            ui.label("Tools").style(
                f"color: {COLORS['light_blue']}; font-weight: bold; font-size: 18px"
            )

            tool_actions = [
                ("Clean", "tools.clean"),
                ("PPA Add", "tools.ppa.add"),
                ("PPA Remove", "tools.ppa.remove"),
                ("Skel", "tools.skel"),
                ("Yolk", "tools.yolk"),
                ("Install Calamares", "calamares.install"),
                ("Remove Calamares", "calamares.remove"),
            ]

            for label, method in tool_actions:

                def make_handler(m=method, l=label):
                    async def handler():
                        log.push(f"\n=== {l} ===")
                        try:
                            client.call_stream(
                                m,
                                {"nointeractive": True},
                                on_line=lambda line: log.push(line),
                            )
                            log.push(f"{l} complete.")
                        except Exception as e:
                            log.push(f"Error: {e}")

                    return handler

                ui.button(label, on_click=make_handler()).style(
                    f"background-color: {COLORS['button']}; margin: 4px"
                )


@ui.page("/")
def index():
    create_ui()


def main():
    port = int(os.getenv("PORT", "8080"))
    ui.run(title="eggs-gui", port=port, host="0.0.0.0", reload=False)


if __name__ == "__main__":
    main()
