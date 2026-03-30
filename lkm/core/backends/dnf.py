"""dnf backend — Fedora, RHEL, AlmaLinux, Rocky, Nobara, Bazzite, and derivatives."""
from __future__ import annotations

from collections.abc import Iterator

from lkm.core.backends.base import PackageBackend
from lkm.core.system import privilege_escalation_cmd


class DnfBackend(PackageBackend):

    @property
    def name(self) -> str:
        return "dnf"

    def install_packages(self, packages: list[str]) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["dnf", "install", "-y"] + packages
        )

    def install_local(self, path: str) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["dnf", "install", "-y", path]
        )

    def remove_packages(self, packages: list[str], purge: bool = False) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["dnf", "remove", "-y"] + packages
        )

    def hold(self, packages: list[str]) -> tuple[int, str, str]:
        priv = privilege_escalation_cmd()
        return self._run(priv + ["dnf", "versionlock", "add"] + packages)

    def unhold(self, packages: list[str]) -> tuple[int, str, str]:
        priv = privilege_escalation_cmd()
        return self._run(priv + ["dnf", "versionlock", "delete"] + packages)

    def is_installed(self, package: str) -> bool:
        rc, _, _ = self._run(["rpm", "-q", package])
        return rc == 0
