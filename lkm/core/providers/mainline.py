"""
Ubuntu Mainline PPA provider.

Fetches the kernel index from kernel.ubuntu.com/mainline and installs
packages via the apt backend.  Works on any apt-based distro.
"""
from __future__ import annotations

import re
import shutil
import urllib.request
from collections.abc import Iterator

from lkm.core.kernel import KernelEntry, KernelFamily, KernelStatus, KernelVersion
from lkm.core.providers.base import KernelProvider
from lkm.core.system import system_info

_INDEX_URL = "https://kernel.ubuntu.com/mainline/"
_SUPPORTED_ARCHES = ["amd64", "arm64", "armhf", "ppc64el", "s390x", "i386"]


class MainlinePpaProvider(KernelProvider):

    @property
    def id(self) -> str:
        return "mainline_ppa"

    @property
    def display_name(self) -> str:
        return "Ubuntu Mainline PPA"

    @property
    def family(self) -> KernelFamily:
        return KernelFamily.MAINLINE

    @property
    def supported_arches(self) -> list[str]:
        return _SUPPORTED_ARCHES

    def is_available(self) -> bool:
        return bool(shutil.which("apt-get") or shutil.which("dpkg"))

    def availability_reason(self) -> str:
        return "Requires apt/dpkg (Debian-based distro)."

    def list(self, arch: str, refresh: bool = False) -> list[KernelEntry]:
        running = system_info().running_kernel
        try:
            with urllib.request.urlopen(_INDEX_URL, timeout=10) as resp:
                html = resp.read().decode()
        except Exception:
            return []

        entries = []
        for m in re.finditer(r'href="v(\d+\.\d+(?:\.\d+)?(?:-rc\d+)?)/"', html):
            ver_str = m.group(1)
            try:
                ver = KernelVersion.parse(ver_str)
            except ValueError:
                continue
            status = KernelStatus.AVAILABLE
            if ver_str in running:
                status = KernelStatus.RUNNING
            entries.append(KernelEntry(
                version=ver,
                family=self.family,
                flavor="generic",
                arch=arch,
                provider_id=self.id,
                status=status,
            ))
        return entries

    def install(self, entry: KernelEntry) -> Iterator[str]:
        ver = str(entry.version)
        arch = entry.arch
        base = f"{_INDEX_URL}v{ver}/{arch}/"
        yield f"Fetching package list from {base}\n"
        try:
            with urllib.request.urlopen(base, timeout=10) as resp:
                html = resp.read().decode()
        except Exception as e:
            raise RuntimeError(f"Cannot reach mainline PPA: {e}") from e

        debs = re.findall(r'href="(linux-(?:image|headers|modules)[^"]+\.deb)"', html)
        if not debs:
            raise RuntimeError(f"No .deb packages found at {base}")

        import os
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            for deb in debs:
                url = base + deb
                dest = os.path.join(tmp, deb)
                yield f"Downloading {deb}\n"
                urllib.request.urlretrieve(url, dest)
            yield from self._backend.install_local(os.path.join(tmp, debs[0]))

    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        ver = str(entry.version)
        pkgs = [
            f"linux-image-{ver}-generic",
            f"linux-headers-{ver}",
            f"linux-modules-{ver}-generic",
        ]
        yield from self._backend.remove_packages(pkgs, purge=purge)
