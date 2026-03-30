"""
xbps backend — Void Linux.

Void ships its own kernel packages (linux, linux-lts, linux-mainline) via the
official xbps repository.  This backend handles install/remove/hold for those
packages and for locally built .xbps archives produced by lkf.

Hold/unhold is implemented via xbps-pkgdb -m hold/unhold, which is the
official Void mechanism for pinning packages.
"""
from __future__ import annotations

import shutil
from typing import Iterator

from lkm.core.backends.base import PackageBackend
from lkm.core.system import privilege_escalation_cmd


class XbpsBackend(PackageBackend):

    @property
    def name(self) -> str:
        return "xbps"

    # ------------------------------------------------------------------
    # Availability guard
    # ------------------------------------------------------------------

    @staticmethod
    def available() -> bool:
        return bool(shutil.which("xbps-install"))

    # ------------------------------------------------------------------
    # Core operations
    # ------------------------------------------------------------------

    def install_packages(self, packages: list[str]) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        # -y: assume yes; -S: sync repos first
        yield from self._run_streaming(
            priv + ["xbps-install", "-Sy"] + packages
        )

    def install_local(self, path: str) -> Iterator[str]:
        """
        Install a locally built .xbps package.

        xbps-install can install from a local repository directory.  We point
        it at the directory containing the package file and install by name.
        """
        import os
        priv = privilege_escalation_cmd()
        pkg_dir = os.path.dirname(os.path.abspath(path))
        # xbps-install -R <repodir> -y <pkgname>
        # The package name is the filename without the arch+suffix.
        pkg_name = os.path.basename(path).split("-")[0]
        yield from self._run_streaming(
            priv + ["xbps-install", "-R", pkg_dir, "-y", pkg_name]
        )

    def remove_packages(self, packages: list[str], purge: bool = False) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        # -R: remove recursively (orphaned deps); -y: assume yes
        flags = ["-Ry"] if purge else ["-y"]
        yield from self._run_streaming(
            priv + ["xbps-remove"] + flags + packages
        )

    def hold(self, packages: list[str]) -> tuple[int, str, str]:
        """
        Pin packages with xbps-pkgdb -m hold.

        A held package is excluded from xbps-install -u (system upgrades)
        but can still be explicitly upgraded.
        """
        priv = privilege_escalation_cmd()
        rc, out, err = 0, "", ""
        for pkg in packages:
            r, o, e = self._run(priv + ["xbps-pkgdb", "-m", "hold", pkg])
            rc = rc or r
            out += o
            err += e
        return rc, out, err

    def unhold(self, packages: list[str]) -> tuple[int, str, str]:
        priv = privilege_escalation_cmd()
        rc, out, err = 0, "", ""
        for pkg in packages:
            r, o, e = self._run(priv + ["xbps-pkgdb", "-m", "unhold", pkg])
            rc = rc or r
            out += o
            err += e
        return rc, out, err

    def is_installed(self, package: str) -> bool:
        rc, out, _ = self._run(["xbps-query", package])
        return rc == 0 and "state: installed" in out.lower()

    # ------------------------------------------------------------------
    # Void-specific helpers
    # ------------------------------------------------------------------

    def list_available_kernels(self) -> list[str]:
        """Return kernel package names available in the xbps repos."""
        rc, out, _ = self._run(["xbps-query", "-Rs", "linux"])
        if rc != 0:
            return []
        names = []
        for line in out.splitlines():
            # lines look like: [-] linux-6.6.30_1  The Linux kernel and modules
            parts = line.split()
            if len(parts) >= 2 and parts[1].startswith("linux"):
                names.append(parts[1].split("_")[0])
        return names

    def sync(self) -> Iterator[str]:
        """Sync xbps repository index."""
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(priv + ["xbps-install", "-S"])
