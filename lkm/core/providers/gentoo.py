"""Gentoo provider — portage + source compilation."""
from __future__ import annotations

import platform
from typing import Iterator

from lkm.core.kernel import KernelEntry, KernelFamily, KernelStatus, KernelVersion
from lkm.core.providers.base import KernelProvider


class GentooProvider(KernelProvider):

    @property
    def id(self) -> str:
        return "gentoo"

    @property
    def display_name(self) -> str:
        return "Gentoo"

    @property
    def family(self) -> KernelFamily:
        return KernelFamily.GENTOO

    @property
    def supported_arches(self) -> list[str]:
        return ["*"]

    def is_available(self) -> bool:
        import shutil
        return bool(shutil.which("emerge"))

    def list(self, arch: str, refresh: bool = False) -> list[KernelEntry]:
        running = platform.release()
        sources = self._backend.list_kernel_sources()
        entries = []
        for src in sources:
            # src is e.g. /usr/src/linux-6.9.0-gentoo
            import re
            m = re.search(r"linux-(\d+\.\d+(?:\.\d+)?)(.*)", src)
            if not m:
                continue
            try:
                ver = KernelVersion.parse(m.group(1) + m.group(2))
            except ValueError:
                continue
            status = KernelStatus.RUNNING if m.group(1) in running else KernelStatus.INSTALLED
            entries.append(KernelEntry(
                version=ver,
                family=self.family,
                flavor="gentoo",
                arch=arch,
                provider_id=self.id,
                status=status,
                local_path=src,
            ))
        return entries

    def install(self, entry: KernelEntry) -> Iterator[str]:
        yield from self._backend.install_packages([f"=sys-kernel/gentoo-sources-{entry.version}"])

    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        yield from self._backend.remove_packages(
            [f"=sys-kernel/gentoo-sources-{entry.version}"], purge=purge
        )

    def compile(self, src: str, use_genkernel: bool, jobs: int) -> Iterator[str]:
        yield from self._backend.compile(src, use_genkernel, jobs)
