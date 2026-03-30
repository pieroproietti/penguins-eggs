"""NixOS provider — declarative kernel management via nixos-rebuild."""
from __future__ import annotations

import platform
from collections.abc import Iterator

from penguins_kernel_manager.core.kernel import KernelEntry, KernelFamily, KernelStatus, KernelVersion
from penguins_kernel_manager.core.providers.base import KernelProvider

# Well-known nixpkgs kernel attribute → approximate version mapping.
# Used to populate the list when nix-env queries are unavailable.
_KNOWN_NIXPKGS_KERNELS: dict[str, str] = {
    "linuxPackages":        "6.6",
    "linuxPackages_latest": "6.12",
    "linuxPackages_6_6":    "6.6",
    "linuxPackages_6_1":    "6.1",
    "linuxPackages_5_15":   "5.15",
    "linuxPackages_rt":     "6.6",
    "linuxPackages_hardened": "6.6",
    "linuxPackages_zen":    "6.12",
}


class NixOSProvider(KernelProvider):

    @property
    def id(self) -> str:
        return "nixos"

    @property
    def display_name(self) -> str:
        return "NixOS"

    @property
    def family(self) -> KernelFamily:
        return KernelFamily.DISTRO

    @property
    def supported_arches(self) -> list[str]:
        return ["*"]

    def is_available(self) -> bool:
        import shutil
        return bool(shutil.which("nixos-rebuild") or shutil.which("nix-env"))

    def list(self, arch: str, refresh: bool = False) -> list[KernelEntry]:
        running = platform.release()
        current_attr = self._backend.current_kernel_attr()
        entries = []

        for attr, ver_str in _KNOWN_NIXPKGS_KERNELS.items():
            try:
                ver = KernelVersion.parse(ver_str)
            except ValueError:
                continue
            is_current = attr in current_attr
            status = (
                KernelStatus.RUNNING if (is_current and ver_str in running)
                else KernelStatus.INSTALLED if is_current
                else KernelStatus.AVAILABLE
            )
            entries.append(KernelEntry(
                version=ver,
                family=self.family,
                flavor=attr,
                arch=arch,
                provider_id=self.id,
                status=status,
            ))
        return entries

    def install(self, entry: KernelEntry) -> Iterator[str]:
        yield from self._backend.install_packages([entry.flavor])

    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        yield from self._backend.remove_packages([entry.flavor], purge=purge)
