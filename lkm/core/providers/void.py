"""Void Linux provider — xbps package manager."""
from __future__ import annotations

import platform
import re
from collections.abc import Iterator

from lkm.core.kernel import KernelEntry, KernelFamily, KernelStatus, KernelVersion
from lkm.core.providers.base import KernelProvider


class VoidProvider(KernelProvider):

    @property
    def id(self) -> str:
        return "void"

    @property
    def display_name(self) -> str:
        return "Void Linux"

    @property
    def family(self) -> KernelFamily:
        return KernelFamily.DISTRO

    @property
    def supported_arches(self) -> list[str]:
        return ["*"]

    def is_available(self) -> bool:
        import shutil
        return bool(shutil.which("xbps-install"))

    def list(self, arch: str, refresh: bool = False) -> list[KernelEntry]:
        running = platform.release()
        if refresh:
            # Consume and discard sync output
            list(self._backend.sync())

        names = self._backend.list_available_kernels()
        entries = []
        for name in names:
            m = re.search(r"(\d+\.\d+(?:\.\d+)?)", name)
            if not m:
                continue
            try:
                ver = KernelVersion.parse(m.group(1))
            except ValueError:
                continue
            installed = self._backend.is_installed(name)
            if installed:
                status = KernelStatus.RUNNING if m.group(1) in running else KernelStatus.INSTALLED
            else:
                status = KernelStatus.AVAILABLE
            entries.append(KernelEntry(
                version=ver,
                family=self.family,
                flavor=name,
                arch=arch,
                provider_id=self.id,
                status=status,
            ))
        return entries

    def install(self, entry: KernelEntry) -> Iterator[str]:
        yield from self._backend.install_packages([entry.flavor])

    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        yield from self._backend.remove_packages([entry.flavor], purge=purge)
