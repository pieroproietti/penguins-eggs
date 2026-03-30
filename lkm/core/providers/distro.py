"""
Distro-native provider.

Lists and manages kernels shipped by the distro's own package manager.
Works on all supported package managers.
"""
from __future__ import annotations

import platform
import re
import shutil
from typing import Iterator

from lkm.core.kernel import KernelEntry, KernelFamily, KernelStatus, KernelVersion
from lkm.core.providers.base import KernelProvider
from lkm.core.system import system_info, PackageManagerKind


class DistroNativeProvider(KernelProvider):

    @property
    def id(self) -> str:
        return "distro"

    @property
    def display_name(self) -> str:
        return "Distro Native"

    @property
    def family(self) -> KernelFamily:
        return KernelFamily.DISTRO

    @property
    def supported_arches(self) -> list[str]:
        return ["*"]

    def is_available(self) -> bool:
        return True

    def list(self, arch: str, refresh: bool = False) -> list[KernelEntry]:
        pm   = system_info().package_manager
        running = platform.release()
        entries = []

        if pm == PackageManagerKind.APT:
            rc, out, _ = self._backend._run(
                ["dpkg-query", "-W", "-f=${Package} ${Version}\n",
                 "linux-image-*"]
            )
            for line in out.splitlines():
                parts = line.split()
                if len(parts) < 2:
                    continue
                pkg, ver_str = parts[0], parts[1]
                m = re.search(r"(\d+\.\d+\.\d+)", ver_str)
                if not m:
                    continue
                try:
                    ver = KernelVersion.parse(m.group(1))
                except ValueError:
                    continue
                status = KernelStatus.RUNNING if m.group(1) in running else KernelStatus.INSTALLED
                entries.append(KernelEntry(
                    version=ver, family=self.family, flavor=pkg,
                    arch=arch, provider_id=self.id, status=status,
                ))

        elif pm == PackageManagerKind.PACMAN:
            rc, out, _ = self._backend._run(["pacman", "-Q"])
            for line in out.splitlines():
                if not line.startswith("linux"):
                    continue
                parts = line.split()
                if len(parts) < 2:
                    continue
                pkg, ver_str = parts[0], parts[1]
                m = re.search(r"(\d+\.\d+(?:\.\d+)?)", ver_str)
                if not m:
                    continue
                try:
                    ver = KernelVersion.parse(m.group(1))
                except ValueError:
                    continue
                status = KernelStatus.RUNNING if m.group(1) in running else KernelStatus.INSTALLED
                entries.append(KernelEntry(
                    version=ver, family=self.family, flavor=pkg,
                    arch=arch, provider_id=self.id, status=status,
                ))

        elif pm == PackageManagerKind.DNF:
            rc, out, _ = self._backend._run(
                ["rpm", "-qa", "--qf", "%{NAME} %{VERSION}-%{RELEASE}\n", "kernel*"]
            )
            for line in out.splitlines():
                parts = line.split()
                if len(parts) < 2:
                    continue
                pkg, ver_str = parts[0], parts[1]
                m = re.search(r"(\d+\.\d+\.\d+)", ver_str)
                if not m:
                    continue
                try:
                    ver = KernelVersion.parse(m.group(1))
                except ValueError:
                    continue
                status = KernelStatus.RUNNING if m.group(1) in running else KernelStatus.INSTALLED
                entries.append(KernelEntry(
                    version=ver, family=self.family, flavor=pkg,
                    arch=arch, provider_id=self.id, status=status,
                ))

        elif pm == PackageManagerKind.XBPS:
            rc, out, _ = self._backend._run(["xbps-query", "-l"])
            for line in out.splitlines():
                if "linux" not in line:
                    continue
                parts = line.split()
                if len(parts) < 2:
                    continue
                pkg_ver = parts[1]
                m = re.search(r"(\d+\.\d+(?:\.\d+)?)", pkg_ver)
                if not m:
                    continue
                try:
                    ver = KernelVersion.parse(m.group(1))
                except ValueError:
                    continue
                status = KernelStatus.RUNNING if m.group(1) in running else KernelStatus.INSTALLED
                entries.append(KernelEntry(
                    version=ver, family=self.family, flavor=pkg_ver.rsplit("-", 1)[0],
                    arch=arch, provider_id=self.id, status=status,
                ))

        return entries

    def install(self, entry: KernelEntry) -> Iterator[str]:
        yield from self._backend.install_packages([entry.flavor])

    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        yield from self._backend.remove_packages([entry.flavor], purge=purge)
