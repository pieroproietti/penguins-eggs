"""Liquorix provider — x86_64, apt repository."""
from __future__ import annotations

import shutil
from collections.abc import Iterator

from lkm.core.kernel import KernelEntry, KernelFamily, KernelStatus, KernelVersion
from lkm.core.providers.base import KernelProvider
from lkm.core.system import system_info

_INSTALL_SCRIPT = "https://liquorix.net/install-liquorix.sh"


class LiquorixProvider(KernelProvider):

    @property
    def id(self) -> str:
        return "liquorix"

    @property
    def display_name(self) -> str:
        return "Liquorix"

    @property
    def family(self) -> KernelFamily:
        return KernelFamily.LIQUORIX

    @property
    def supported_arches(self) -> list[str]:
        return ["amd64"]

    def is_available(self) -> bool:
        return bool(shutil.which("apt-get"))

    def availability_reason(self) -> str:
        return "Liquorix requires apt (x86_64 only)."

    def list(self, arch: str, refresh: bool = False) -> list[KernelEntry]:
        running = system_info().running_kernel
        # Liquorix doesn't publish a machine-readable index; check if installed
        installed = self._backend.is_installed("linux-image-liquorix-amd64")
        if installed:
            # Best-effort: parse version from dpkg
            rc, out, _ = self._backend._run(
                ["dpkg-query", "-W", "-f=${Version}", "linux-image-liquorix-amd64"]
            )
            ver_str = out.strip().split("+")[0] if rc == 0 else "0.0.0"
            try:
                ver = KernelVersion.parse(ver_str)
            except ValueError:
                ver = KernelVersion(0, 0, 0)
            status = KernelStatus.RUNNING if ver_str in running else KernelStatus.INSTALLED
            return [KernelEntry(
                version=ver,
                family=self.family,
                flavor="liquorix",
                arch=arch,
                provider_id=self.id,
                status=status,
            )]
        return []

    def install(self, entry: KernelEntry) -> Iterator[str]:
        yield "Downloading Liquorix install script...\n"
        import os
        import stat
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".sh", delete=False) as f:
            tmp = f.name
        import urllib.request
        urllib.request.urlretrieve(_INSTALL_SCRIPT, tmp)
        os.chmod(tmp, os.stat(tmp).st_mode | stat.S_IEXEC)
        yield "Running Liquorix installer...\n"
        from lkm.core.system import privilege_escalation_cmd
        priv = privilege_escalation_cmd()
        yield from self._backend._run_streaming(priv + ["bash", tmp])

    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        pkgs = ["linux-image-liquorix-amd64", "linux-headers-liquorix-amd64"]
        yield from self._backend.remove_packages(pkgs, purge=purge)
