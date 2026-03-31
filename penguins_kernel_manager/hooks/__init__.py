"""
penguins_kernel_manager.hooks

Bidirectional integration hooks for penguins-eggs and penguins-recovery.

Outbound (pkm → ecosystem):
  - pre_install  : snapshot via penguins-recovery before installing a kernel
  - post_install : notify penguins-eggs that the kernel list changed
  - pre_remove   : warn if the kernel is embedded in the last eggs ISO
  - post_remove_old : optionally trigger an eggs ISO rebuild

Inbound (ecosystem → pkm):
  The shell scripts in integration/ register pkm as a plugin for both tools.
  This module is the Python counterpart used by KernelManager.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

# ---------------------------------------------------------------------------
# Patchable path constants — extracted so tests can override them without
# needing to mock the Path class itself (which is fragile).
# ---------------------------------------------------------------------------

#: Path to the kernel manifest written by pkm-hook.sh during eggs produce.
KERNEL_MANIFEST_PATH = Path("/etc/penguins-kernel-manager/kernel-manifest.json")

#: Path to the eggs plugin hook script shipped with this package.
EGGS_HOOK_SCRIPT = (
    Path(__file__).parent.parent.parent
    / "integration"
    / "eggs-plugin"
    / "pkm-hook.sh"
)

# ---------------------------------------------------------------------------
# Configuration — read from /etc/penguins-kernel-manager/hooks.conf (TOML)
# or fall back to environment variables / built-in defaults.
# ---------------------------------------------------------------------------

def _cfg() -> dict:
    """Return hook configuration, merging file config with env overrides."""
    defaults: dict = {
        "eggs_bin": os.environ.get("PKM_EGGS_BIN", "eggs"),
        "recovery_bin": os.environ.get("PKM_RECOVERY_BIN", "penguins-recovery"),
        "pre_install_snapshot": True,
        "post_install_notify": True,
        "pre_remove_warn": True,
        "post_remove_old_sync": False,
    }
    cfg_path = Path("/etc/penguins-kernel-manager/hooks.conf")
    if cfg_path.exists():
        try:
            import tomllib  # Python 3.11+
            with cfg_path.open("rb") as fh:
                file_cfg = tomllib.load(fh).get("hooks", {})
            defaults.update(file_cfg)
        except Exception:
            pass
    return defaults


def _available(binary: str) -> bool:
    return bool(binary) and shutil.which(binary) is not None


def _run(cmd: list[str], *, check: bool = False) -> int:
    """Run a subprocess, returning its exit code. Never raises unless check=True."""
    try:
        return subprocess.run(cmd, check=check).returncode
    except Exception:
        return 1


# ---------------------------------------------------------------------------
# Outbound hooks — called by KernelManager
# ---------------------------------------------------------------------------

def pre_install(version: str, flavor: str = "") -> None:
    """
    Called before a kernel install begins.

    If penguins-recovery is available, creates a named snapshot so the user
    can roll back if the new kernel fails to boot.
    """
    cfg = _cfg()
    if not cfg.get("pre_install_snapshot"):
        return
    recovery = cfg["recovery_bin"]
    if not _available(recovery):
        return
    label = f"pre-kernel-{version}" + (f"-{flavor}" if flavor else "")
    _run([recovery, "snapshot", "create", label])


def post_install(version: str, flavor: str = "") -> None:
    """
    Called after a kernel install completes successfully.

    Notifies penguins-eggs that the kernel list has changed so the next
    `eggs produce` will embed the correct kernel.
    """
    cfg = _cfg()
    if not cfg.get("post_install_notify"):
        return
    eggs = cfg["eggs_bin"]
    if not _available(eggs):
        return
    # penguins-eggs reads EGGS_HOOK to decide what to do
    if EGGS_HOOK_SCRIPT.exists():
        hook_env = {**os.environ, "EGGS_HOOK": "kernel-changed", "PKM_KERNEL_VERSION": version}
        try:
            subprocess.run(["bash", str(EGGS_HOOK_SCRIPT)], env=hook_env, check=False)
        except Exception:
            pass


def pre_remove(version: str) -> str | None:
    """
    Called before a kernel is removed.

    Returns a warning string if the kernel appears in the last eggs ISO
    manifest, or None if it is safe to remove.
    """
    cfg = _cfg()
    if not cfg.get("pre_remove_warn"):
        return None
    manifest = KERNEL_MANIFEST_PATH
    if not manifest.exists():
        return None
    try:
        data = json.loads(manifest.read_text())
        for entry in data:
            if entry.get("version") == version and entry.get("embedded_in_iso"):
                return (
                    f"Kernel {version} is embedded in the last penguins-eggs ISO. "
                    "Removing it will not affect the ISO, but the live environment "
                    "will use a different kernel than the installed system."
                )
    except Exception:
        pass
    return None


def post_remove_old(kept_versions: list[str]) -> None:
    """
    Called after remove-old completes.

    If post_remove_old_sync is enabled, triggers a non-blocking eggs ISO
    rebuild so the ISO always reflects the current kernel set.
    """
    cfg = _cfg()
    if not cfg.get("post_remove_old_sync"):
        return
    eggs = cfg["eggs_bin"]
    if not _available(eggs):
        return
    # Fire-and-forget: do not block the caller
    subprocess.Popen(
        [eggs, "produce", "--update-kernel-list"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
