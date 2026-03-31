"""apk backend — Alpine Linux."""
from __future__ import annotations

from collections.abc import Iterator

from penguins_kernel_manager.core.backends.base import PackageBackend
from penguins_kernel_manager.core.system import privilege_escalation_cmd


class ApkBackend(PackageBackend):

    @property
    def name(self) -> str:
        return "apk"

    def install_packages(self, packages: list[str]) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["apk", "add", "--no-cache"] + packages
        )

    def install_local(self, path: str) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["apk", "add", "--allow-untrusted", path]
        )

    def remove_packages(self, packages: list[str], purge: bool = False) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        flags = ["--purge"] if purge else []
        yield from self._run_streaming(
            priv + ["apk", "del"] + flags + packages
        )

    def hold(self, packages: list[str]) -> tuple[int, str, str]:
        # apk uses world file pinning; mark packages as pinned
        priv = privilege_escalation_cmd()
        return self._run(priv + ["apk", "add", "--no-cache"] + [f"{p}=={p}" for p in packages])

    def unhold(self, packages: list[str]) -> tuple[int, str, str]:
        priv = privilege_escalation_cmd()
        return self._run(priv + ["apk", "add", "--no-cache"] + packages)

    def is_installed(self, package: str) -> bool:
        rc, _, _ = self._run(["apk", "info", "-e", package])
        return rc == 0
