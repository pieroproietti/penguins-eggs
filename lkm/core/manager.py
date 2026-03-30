"""
KernelManager — the central coordinator.

Aggregates all providers, manages per-kernel notes and locks (persisted to
~/.config/lkm/state.json), and exposes a unified API used by both the CLI
and the GUI.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Iterator

from lkm.core.kernel import KernelEntry, KernelFamily, KernelStatus
from lkm.core.providers import get_providers
from lkm.core.providers.base import KernelProvider
from lkm.core.providers.local_file import LocalFileProvider
from lkm.core.providers.lkf_build import LkfBuildProvider
from lkm.core.system import system_info

_STATE_FILE = Path.home() / ".config" / "lkm" / "state.json"


class KernelManager:

    def __init__(self, arch: str | None = None) -> None:
        self._arch      = arch or system_info().arch
        self._providers = get_providers(self._arch)
        self._state     = self._load_state()

    # ------------------------------------------------------------------
    # Provider access
    # ------------------------------------------------------------------

    @property
    def providers(self) -> list[KernelProvider]:
        return self._providers

    def provider(self, provider_id: str) -> KernelProvider | None:
        return next((p for p in self._providers if p.id == provider_id), None)

    @property
    def lkf_provider(self) -> LkfBuildProvider | None:
        p = self.provider("lkf_build")
        return p if isinstance(p, LkfBuildProvider) else None

    # ------------------------------------------------------------------
    # Kernel listing
    # ------------------------------------------------------------------

    def list_all(self, refresh: bool = False) -> list[KernelEntry]:
        """Return all kernels from all providers, sorted newest first."""
        entries: list[KernelEntry] = []
        for prov in self._providers:
            try:
                entries.extend(prov.list(self._arch, refresh=refresh))
            except Exception:
                pass

        for entry in entries:
            key = self._state_key(entry)
            entry.notes = self._state.get("notes", {}).get(key, "")
            if self._state.get("locked", {}).get(key):
                entry.held = True
                if entry.status == KernelStatus.INSTALLED:
                    entry.status = KernelStatus.HELD

        return sorted(entries, key=lambda e: e.version, reverse=True)

    def list_by_family(self, family: KernelFamily, refresh: bool = False) -> list[KernelEntry]:
        return [e for e in self.list_all(refresh=refresh) if e.family == family]

    def list_installed(self) -> list[KernelEntry]:
        return [e for e in self.list_all() if e.is_installed]

    def running_kernel(self) -> KernelEntry | None:
        for e in self.list_all():
            if e.is_running:
                return e
        return None

    # ------------------------------------------------------------------
    # Install / Remove
    # ------------------------------------------------------------------

    def install(self, entry: KernelEntry) -> Iterator[str]:
        prov = self.provider(entry.provider_id)
        if prov is None:
            raise RuntimeError(f"Provider '{entry.provider_id}' not found.")
        if not prov.is_available():
            raise RuntimeError(
                f"Provider '{prov.display_name}' is not available: "
                f"{prov.availability_reason()}"
            )
        yield from prov.install(entry)

    def install_local(self, path: str) -> Iterator[str]:
        """Install a local package file directly, bypassing provider selection."""
        prov = self.provider("local_file")
        if prov is None or not isinstance(prov, LocalFileProvider):
            # Fallback: use backend directly
            yield from self._providers[0]._backend.install_local(path)
            return
        yield from prov.install_from_path(path)

    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        if entry.is_running:
            raise RuntimeError("Cannot remove the currently running kernel.")
        if entry.held:
            raise RuntimeError(
                f"Kernel {entry.display_name} is locked. Unlock it first."
            )
        prov = self.provider(entry.provider_id)
        if prov is None:
            raise RuntimeError(f"Provider '{entry.provider_id}' not found.")
        yield from prov.remove(entry, purge=purge)

    # ------------------------------------------------------------------
    # Hold / Lock
    # ------------------------------------------------------------------

    def hold(self, entry: KernelEntry) -> tuple[int, str, str]:
        prov = self.provider(entry.provider_id)
        if prov is None:
            return 1, "", f"Provider '{entry.provider_id}' not found."
        rc, out, err = prov.hold(entry)
        if rc == 0:
            self._set_locked(entry, True)
        return rc, out, err

    def unhold(self, entry: KernelEntry) -> tuple[int, str, str]:
        prov = self.provider(entry.provider_id)
        if prov is None:
            return 1, "", f"Provider '{entry.provider_id}' not found."
        rc, out, err = prov.unhold(entry)
        if rc == 0:
            self._set_locked(entry, False)
        return rc, out, err

    # ------------------------------------------------------------------
    # Notes
    # ------------------------------------------------------------------

    def set_note(self, entry: KernelEntry, note: str) -> None:
        key = self._state_key(entry)
        self._state.setdefault("notes", {})[key] = note
        entry.notes = note
        self._save_state()

    def get_note(self, entry: KernelEntry) -> str:
        return self._state.get("notes", {}).get(self._state_key(entry), "")

    # ------------------------------------------------------------------
    # Remove old kernels
    # ------------------------------------------------------------------

    def remove_old(self, keep: int = 1, purge: bool = False) -> Iterator[str]:
        installed = sorted(
            [e for e in self.list_installed() if not e.is_running and not e.held],
            key=lambda e: e.version,
            reverse=True,
        )
        to_remove = installed[keep:]
        if not to_remove:
            yield "No old kernels to remove.\n"
            return
        for entry in to_remove:
            yield f"Removing {entry.display_name}...\n"
            yield from self.remove(entry, purge=purge)

    # ------------------------------------------------------------------
    # Secure boot warning
    # ------------------------------------------------------------------

    def secure_boot_warning(self) -> str | None:
        if system_info().has_secure_boot:
            return (
                "Secure Boot is enabled. Mainline, XanMod, Liquorix, and lkf-built "
                "kernels are unsigned and will not boot with Secure Boot enabled. "
                "Disable Secure Boot in firmware settings, or use only your "
                "distribution's signed kernels."
            )
        return None

    # ------------------------------------------------------------------
    # NixOS guard
    # ------------------------------------------------------------------

    def nixos_build_warning(self) -> str | None:
        info = system_info()
        from lkm.core.system import DistroFamily
        if info.distro.family == DistroFamily.NIXOS and not info.in_nix_shell:
            return (
                "NixOS detected outside a nix-shell. Build tools may be missing.\n"
                "Enter the lkf environment first:\n"
                "  nix-shell <lkf-root>/nix/shell.nix --run 'lkm build ...'\n"
                "Set LKM_NIX_SHELL=1 to suppress this warning."
            )
        return None

    # ------------------------------------------------------------------
    # State persistence
    # ------------------------------------------------------------------

    def _state_key(self, entry: KernelEntry) -> str:
        return f"{entry.provider_id}:{entry.version}:{entry.flavor}:{entry.arch}"

    def _set_locked(self, entry: KernelEntry, locked: bool) -> None:
        key = self._state_key(entry)
        self._state.setdefault("locked", {})[key] = locked
        self._save_state()

    def _load_state(self) -> dict:
        if _STATE_FILE.exists():
            try:
                return json.loads(_STATE_FILE.read_text())
            except Exception:
                pass
        return {"notes": {}, "locked": {}}

    def _save_state(self) -> None:
        _STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        _STATE_FILE.write_text(json.dumps(self._state, indent=2))
