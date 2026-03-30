"""XanMod provider — x86_64 only, apt repository."""
from __future__ import annotations

import shutil
import urllib.request
from collections.abc import Iterator

from lkm.core.kernel import KernelEntry, KernelFamily, KernelStatus, KernelVersion
from lkm.core.providers.base import KernelProvider
from lkm.core.system import system_info

_REPO_LINE = "deb [signed-by=/usr/share/keyrings/xanmod-archive-keyring.gpg] http://deb.xanmod.org releases main"
_KEY_URL   = "https://dl.xanmod.org/archive.key"
_FLAVORS   = ["xanmod1", "xanmod2", "xanmod3", "xanmod4", "edge", "lts", "rt"]


class XanmodProvider(KernelProvider):

    @property
    def id(self) -> str:
        return "xanmod"

    @property
    def display_name(self) -> str:
        return "XanMod"

    @property
    def family(self) -> KernelFamily:
        return KernelFamily.XANMOD

    @property
    def supported_arches(self) -> list[str]:
        return ["amd64"]

    def is_available(self) -> bool:
        return bool(shutil.which("apt-get"))

    def availability_reason(self) -> str:
        return "XanMod requires apt (x86_64 only)."

    def list(self, arch: str, refresh: bool = False) -> list[KernelEntry]:
        running = system_info().running_kernel
        try:
            with urllib.request.urlopen(
                "https://dl.xanmod.org/versions.json", timeout=10
            ) as resp:
                import json
                data = json.loads(resp.read())
        except Exception:
            return []

        entries = []
        for item in data.get("kernels", []):
            ver_str = item.get("version", "")
            flavor  = item.get("flavor", "xanmod1")
            try:
                ver = KernelVersion.parse(ver_str)
            except ValueError:
                continue
            status = KernelStatus.RUNNING if ver_str in running else KernelStatus.AVAILABLE
            entries.append(KernelEntry(
                version=ver,
                family=self.family,
                flavor=flavor,
                arch=arch,
                provider_id=self.id,
                status=status,
            ))
        return entries

    def install(self, entry: KernelEntry) -> Iterator[str]:
        # Ensure the XanMod repo is present
        yield "Adding XanMod repository...\n"
        yield from self._backend.add_apt_repo(_REPO_LINE, _KEY_URL)
        pkg = f"linux-xanmod-{entry.flavor}"
        yield f"Installing {pkg}\n"
        yield from self._backend.install_packages([pkg])

    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        pkg = f"linux-xanmod-{entry.flavor}"
        yield from self._backend.remove_packages([pkg], purge=purge)
