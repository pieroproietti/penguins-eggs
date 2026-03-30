"""zypper backend — openSUSE Leap, Tumbleweed, SLES, Regata."""
from __future__ import annotations

from typing import Iterator

from lkm.core.backends.base import PackageBackend
from lkm.core.system import privilege_escalation_cmd


class ZypperBackend(PackageBackend):

    @property
    def name(self) -> str:
        return "zypper"

    def install_packages(self, packages: list[str]) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["zypper", "--non-interactive", "install"] + packages
        )

    def install_local(self, path: str) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["zypper", "--non-interactive", "install", path]
        )

    def remove_packages(self, packages: list[str], purge: bool = False) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["zypper", "--non-interactive", "remove"] + packages
        )

    def hold(self, packages: list[str]) -> tuple[int, str, str]:
        priv = privilege_escalation_cmd()
        return self._run(priv + ["zypper", "addlock"] + packages)

    def unhold(self, packages: list[str]) -> tuple[int, str, str]:
        priv = privilege_escalation_cmd()
        return self._run(priv + ["zypper", "removelock"] + packages)

    def is_installed(self, package: str) -> bool:
        rc, _, _ = self._run(["rpm", "-q", package])
        return rc == 0
