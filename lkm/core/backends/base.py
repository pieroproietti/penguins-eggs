"""
Abstract base class for package manager backends.

Each backend wraps one package manager (apt, pacman, dnf, …) and exposes a
uniform interface for install/remove/hold/unhold operations.  Backends do not
know about kernel families or providers — that logic lives in providers/.
"""
from __future__ import annotations

import subprocess
from abc import ABC, abstractmethod
from typing import Iterator


class PackageBackend(ABC):

    # ------------------------------------------------------------------
    # Identity
    # ------------------------------------------------------------------

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name, e.g. 'apt'."""

    # ------------------------------------------------------------------
    # Core operations — all yield log lines as strings
    # ------------------------------------------------------------------

    @abstractmethod
    def install_packages(self, packages: list[str]) -> Iterator[str]:
        """Install one or more packages by name."""

    @abstractmethod
    def install_local(self, path: str) -> Iterator[str]:
        """Install a local package file (.deb, .rpm, .pkg.tar.*, etc.)."""

    @abstractmethod
    def remove_packages(self, packages: list[str], purge: bool = False) -> Iterator[str]:
        """Remove one or more packages."""

    @abstractmethod
    def hold(self, packages: list[str]) -> tuple[int, str, str]:
        """Pin packages so they are not auto-upgraded. Returns (rc, stdout, stderr)."""

    @abstractmethod
    def unhold(self, packages: list[str]) -> tuple[int, str, str]:
        """Release pinned packages."""

    @abstractmethod
    def is_installed(self, package: str) -> bool:
        """Return True if the package is currently installed."""

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _run_streaming(self, cmd: list[str], **kwargs) -> Iterator[str]:
        """Run a command and yield stdout lines as they arrive."""
        with subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            **kwargs,
        ) as proc:
            assert proc.stdout is not None
            for line in proc.stdout:
                yield line
            proc.wait()
            if proc.returncode != 0:
                raise RuntimeError(
                    f"Command {cmd[0]!r} exited with code {proc.returncode}"
                )

    def _run(self, cmd: list[str], **kwargs) -> tuple[int, str, str]:
        """Run a command and return (returncode, stdout, stderr)."""
        result = subprocess.run(
            cmd, capture_output=True, text=True, **kwargs
        )
        return result.returncode, result.stdout, result.stderr
