import os
import sys
import yaml

from py_oa_tools.pkg import distro
from py_oa_tools.pkg.template_renderer import TemplateRenderer


class PilotError(Exception):
    pass


def _package_brain_path():
    if getattr(sys, "_MEIPASS", None):
        return os.path.join(sys._MEIPASS, "py_oa_tools", "brain.d")
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "brain.d"))


def detect_and_load():
    # Prefer package-embedded brain.d, then local development folder, then system install
    pkg_brain = _package_brain_path()
    paths_to_try = [
        pkg_brain,
        os.path.join("coa", "brain.d"),
        "/etc/oa-tools.d/brain.d",
    ]

    base_dir = None
    for path in paths_to_try:
        if os.path.isfile(os.path.join(path, "index.yaml")):
            base_dir = path
            break

    if not base_dir:
        raise PilotError("No brain.d configuration found")

    with open(os.path.join(base_dir, "index.yaml"), "r", encoding="utf-8") as fp:
        index = yaml.safe_load(fp)

    host_distro = distro.Distro.from_os_release()
    distro_id = host_distro.distro_id.lower()
    distro_like = host_distro.distro_like.lower()

    module_file = None
    for entry in index.get("distributions", []):
        if entry.get("id") == distro_id:
            module_file = entry.get("file")
            break
        for like in entry.get("like", []):
            if like == distro_id or like == distro_like:
                module_file = entry.get("file")
                break
        if module_file:
            break

    if not module_file:
        raise PilotError(f"No module found for distro id {distro_id}")

    common_path = os.path.join(base_dir, "common.bash.tmpl")
    module_path = os.path.join(base_dir, "modules", module_file)
    base_path = os.path.join(base_dir, "base.yaml.tmpl")

    renderer = TemplateRenderer()
    for path in (common_path, module_path, base_path):
        with open(path, "r", encoding="utf-8") as fp:
            renderer.add_definitions(fp.read())

    with open(base_path, "r", encoding="utf-8") as fp:
        base_content = fp.read()

    rendered = renderer.render(base_content)
    return yaml.safe_load(rendered)
