"""
Package manager backends.

Use get_backend() to obtain the correct backend for the current system.
"""
from __future__ import annotations

from penguins_kernel_manager.core.backends.apk import ApkBackend
from penguins_kernel_manager.core.backends.apt import AptBackend
from penguins_kernel_manager.core.backends.base import PackageBackend
from penguins_kernel_manager.core.backends.dnf import DnfBackend
from penguins_kernel_manager.core.backends.nix import NixBackend
from penguins_kernel_manager.core.backends.pacman import PacmanBackend
from penguins_kernel_manager.core.backends.portage import PortageBackend
from penguins_kernel_manager.core.backends.xbps import XbpsBackend
from penguins_kernel_manager.core.backends.zypper import ZypperBackend
from penguins_kernel_manager.core.system import PackageManagerKind, system_info

_BACKEND_MAP: dict[PackageManagerKind, type[PackageBackend]] = {
    PackageManagerKind.APT:     AptBackend,
    PackageManagerKind.PACMAN:  PacmanBackend,
    PackageManagerKind.DNF:     DnfBackend,
    PackageManagerKind.ZYPPER:  ZypperBackend,
    PackageManagerKind.APK:     ApkBackend,
    PackageManagerKind.PORTAGE: PortageBackend,
    PackageManagerKind.XBPS:    XbpsBackend,
    PackageManagerKind.NIX:     NixBackend,
}


def get_backend() -> PackageBackend:
    """Return the appropriate backend for the current system."""
    kind = system_info().package_manager
    cls  = _BACKEND_MAP.get(kind)
    if cls is None:
        raise RuntimeError(
            f"No package backend available for package manager: {kind.value}. "
            "penguins-kernel-manager supports apt, pacman, dnf, zypper, apk, portage, xbps, and nix."
        )
    return cls()


__all__ = [
    "PackageBackend",
    "AptBackend",
    "PacmanBackend",
    "DnfBackend",
    "ZypperBackend",
    "ApkBackend",
    "PortageBackend",
    "XbpsBackend",
    "NixBackend",
    "get_backend",
]
