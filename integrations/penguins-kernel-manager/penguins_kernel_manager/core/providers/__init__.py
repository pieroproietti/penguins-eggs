"""
Kernel providers.

get_providers(arch) returns the list of providers available on the current
system for the given architecture.  Providers that are not available (missing
tools, wrong arch, etc.) are silently excluded so the rest of the UI still
works.
"""
from __future__ import annotations

from penguins_kernel_manager.core.backends import get_backend
from penguins_kernel_manager.core.providers.base import KernelProvider
from penguins_kernel_manager.core.providers.distro import DistroNativeProvider
from penguins_kernel_manager.core.providers.gentoo import GentooProvider
from penguins_kernel_manager.core.providers.liquorix import LiquorixProvider
from penguins_kernel_manager.core.providers.lkf_build import LkfBuildProvider
from penguins_kernel_manager.core.providers.local_file import LocalFileProvider
from penguins_kernel_manager.core.providers.mainline import MainlinePpaProvider
from penguins_kernel_manager.core.providers.nixos import NixOSProvider
from penguins_kernel_manager.core.providers.void import VoidProvider
from penguins_kernel_manager.core.providers.xanmod import XanmodProvider
from penguins_kernel_manager.core.system import DistroFamily, system_info


def get_providers(arch: str) -> list[KernelProvider]:
    """Return all providers that are available on the current system."""
    backend = get_backend()
    info    = system_info()

    candidates: list[KernelProvider] = [
        MainlinePpaProvider(backend),
        XanmodProvider(backend),
        LiquorixProvider(backend),
        DistroNativeProvider(backend),
        LocalFileProvider(backend),
        LkfBuildProvider(backend),
    ]

    # Family-specific providers
    if info.distro.family == DistroFamily.GENTOO:
        candidates.append(GentooProvider(backend))
    if info.distro.family == DistroFamily.VOID:
        candidates.append(VoidProvider(backend))
    if info.distro.family == DistroFamily.NIXOS:
        candidates.append(NixOSProvider(backend))

    return [p for p in candidates if p.supports_arch(arch) and p.is_available()]


__all__ = [
    "KernelProvider",
    "MainlinePpaProvider",
    "XanmodProvider",
    "LiquorixProvider",
    "DistroNativeProvider",
    "LocalFileProvider",
    "LkfBuildProvider",
    "GentooProvider",
    "VoidProvider",
    "NixOSProvider",
    "get_providers",
]
