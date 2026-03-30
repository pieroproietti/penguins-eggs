"""
Kernel data model: KernelEntry, KernelVersion, KernelFamily, KernelStatus.

Unchanged from ukm except KernelFamily gains LKF_BUILD for locally compiled
kernels produced by the lkf build pipeline.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from functools import total_ordering


class KernelFamily(Enum):
    MAINLINE    = "mainline"     # Ubuntu Mainline PPA
    XANMOD      = "xanmod"
    LIQUORIX    = "liquorix"
    DISTRO      = "distro"       # whatever the distro ships
    GENTOO      = "gentoo"
    LOCAL_FILE  = "local_file"   # pre-built .deb/.rpm/.pkg.tar.* dropped in
    LKF_BUILD   = "lkf_build"    # compiled by the lkf build pipeline


class KernelStatus(Enum):
    AVAILABLE   = "available"
    INSTALLED   = "installed"
    RUNNING     = "running"
    HELD        = "held"


@total_ordering
@dataclass
class KernelVersion:
    """Comparable semantic kernel version, e.g. 6.12.3."""
    major: int
    minor: int
    patch: int
    extra: str = ""   # e.g. "-xanmod1", "-rt4", "-lkf"

    _VERSION_RE = re.compile(
        r"^(\d+)\.(\d+)(?:\.(\d+))?(.*)$"
    )

    @classmethod
    def parse(cls, s: str) -> KernelVersion:
        m = cls._VERSION_RE.match(s.strip())
        if not m:
            raise ValueError(f"Cannot parse kernel version: {s!r}")
        major = int(m.group(1))
        minor = int(m.group(2))
        patch = int(m.group(3) or 0)
        extra = m.group(4) or ""
        return cls(major=major, minor=minor, patch=patch, extra=extra)

    def __str__(self) -> str:
        return f"{self.major}.{self.minor}.{self.patch}{self.extra}"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, KernelVersion):
            return NotImplemented
        return (self.major, self.minor, self.patch) == (other.major, other.minor, other.patch)

    def __lt__(self, other: KernelVersion) -> bool:
        return (self.major, self.minor, self.patch) < (other.major, other.minor, other.patch)

    def __hash__(self) -> int:
        return hash((self.major, self.minor, self.patch, self.extra))


@dataclass
class KernelEntry:
    """A single kernel known to penguins-kernel-manager — may be available, installed, or running."""
    version:     KernelVersion
    family:      KernelFamily
    flavor:      str          # e.g. "generic", "rt", "xanmod-edge", "lkf-tkg"
    arch:        str          # normalised arch string
    provider_id: str          # matches KernelProvider.id
    status:      KernelStatus = KernelStatus.AVAILABLE
    held:        bool         = False
    notes:       str          = ""
    # For LOCAL_FILE / LKF_BUILD: path to the package file
    local_path:  str | None = field(default=None)

    @property
    def display_name(self) -> str:
        return f"{self.version} ({self.family.value}, {self.flavor})"

    @property
    def is_installed(self) -> bool:
        return self.status in (KernelStatus.INSTALLED, KernelStatus.RUNNING, KernelStatus.HELD)

    @property
    def is_running(self) -> bool:
        return self.status == KernelStatus.RUNNING
