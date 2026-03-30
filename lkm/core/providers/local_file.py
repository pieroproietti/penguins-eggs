"""
LocalFile provider.

Installs a pre-built kernel package dropped in by the user — .deb, .rpm,
.pkg.tar.zst, .apk, or .xbps.  The package is detected by file extension and
delegated to the appropriate backend method.

This is the handoff point for packages built externally (e.g. by lkf).
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Iterator

from lkm.core.kernel import KernelEntry, KernelFamily, KernelStatus, KernelVersion
from lkm.core.providers.base import KernelProvider

_SUPPORTED_EXTENSIONS = {".deb", ".rpm", ".pkg.tar.zst", ".pkg.tar.xz", ".apk", ".xbps"}


class LocalFileProvider(KernelProvider):

    @property
    def id(self) -> str:
        return "local_file"

    @property
    def display_name(self) -> str:
        return "Local File"

    @property
    def family(self) -> KernelFamily:
        return KernelFamily.LOCAL_FILE

    @property
    def supported_arches(self) -> list[str]:
        return ["*"]

    def is_available(self) -> bool:
        return True

    def list(self, arch: str, refresh: bool = False) -> list[KernelEntry]:
        # LocalFile kernels are not pre-listed; they are installed on demand
        # via install_from_path().  Return empty list for the standard listing.
        return []

    def install(self, entry: KernelEntry) -> Iterator[str]:
        if not entry.local_path:
            raise RuntimeError("LocalFileProvider.install() requires entry.local_path to be set.")
        yield from self.install_from_path(entry.local_path)

    def install_from_path(self, path: str) -> Iterator[str]:
        """Install a kernel package from an absolute file path."""
        p = Path(path)
        if not p.exists():
            raise RuntimeError(f"Package file not found: {path}")

        suffix = "".join(p.suffixes[-2:]) if len(p.suffixes) >= 2 else p.suffix
        if suffix not in _SUPPORTED_EXTENSIONS and p.suffix not in _SUPPORTED_EXTENSIONS:
            raise RuntimeError(
                f"Unsupported package format: {p.name}\n"
                f"Supported: {', '.join(sorted(_SUPPORTED_EXTENSIONS))}"
            )

        yield f"Installing local package: {p.name}\n"
        yield from self._backend.install_local(str(p))

    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        yield from self._backend.remove_packages([entry.flavor], purge=purge)

    # ------------------------------------------------------------------
    # Helper: build a KernelEntry from a file path
    # ------------------------------------------------------------------

    @staticmethod
    def entry_from_path(path: str, arch: str) -> KernelEntry:
        """
        Construct a KernelEntry from a local package file path.

        Version is extracted from the filename with a best-effort regex.
        """
        name = Path(path).name
        m = re.search(r"(\d+\.\d+(?:\.\d+)?)", name)
        if m:
            try:
                ver = KernelVersion.parse(m.group(1))
            except ValueError:
                ver = KernelVersion(0, 0, 0, extra="-unknown")
        else:
            ver = KernelVersion(0, 0, 0, extra="-unknown")

        # Use the stem (without extension) as the flavor
        flavor = Path(path).stem.split("_")[0].split("-")[0]

        return KernelEntry(
            version=ver,
            family=KernelFamily.LOCAL_FILE,
            flavor=flavor,
            arch=arch,
            provider_id="local_file",
            status=KernelStatus.AVAILABLE,
            local_path=path,
        )
