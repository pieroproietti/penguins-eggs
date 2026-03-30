"""
Abstract base class for kernel providers.

Unchanged from ukm except imports are updated to lkm namespace.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterator

from lkm.core.kernel import KernelEntry, KernelFamily


class KernelProvider(ABC):

    def __init__(self, backend) -> None:
        self._backend = backend

    # ------------------------------------------------------------------
    # Identity
    # ------------------------------------------------------------------

    @property
    @abstractmethod
    def id(self) -> str:
        """Stable machine identifier, e.g. 'mainline_ppa'."""

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable name shown in the GUI tab."""

    @property
    @abstractmethod
    def family(self) -> KernelFamily:
        """The KernelFamily this provider belongs to."""

    @property
    @abstractmethod
    def supported_arches(self) -> list[str]:
        """
        Normalised arch strings this provider can serve.
        Use ['*'] to mean all architectures.
        """

    # ------------------------------------------------------------------
    # Availability
    # ------------------------------------------------------------------

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if this provider can operate on the current system."""

    def availability_reason(self) -> str:
        return ""

    # ------------------------------------------------------------------
    # Core operations
    # ------------------------------------------------------------------

    @abstractmethod
    def list(self, arch: str, refresh: bool = False) -> list[KernelEntry]:
        """Return all known kernels for the given arch."""

    @abstractmethod
    def install(self, entry: KernelEntry) -> Iterator[str]:
        """Install the given kernel. Yields log lines."""

    @abstractmethod
    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        """Remove the given kernel. Yields log lines."""

    def hold(self, entry: KernelEntry) -> tuple[int, str, str]:
        return self._backend.hold([entry.display_name])

    def unhold(self, entry: KernelEntry) -> tuple[int, str, str]:
        return self._backend.unhold([entry.display_name])

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def supports_arch(self, arch: str) -> bool:
        arches = self.supported_arches
        return "*" in arches or arch in arches

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(id={self.id!r})"
