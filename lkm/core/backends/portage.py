"""portage backend — Gentoo."""
from __future__ import annotations

import os
import shutil
from pathlib import Path
from typing import Iterator

from lkm.core.backends.base import PackageBackend
from lkm.core.system import privilege_escalation_cmd

_KERNEL_SOURCES_DIR = Path("/usr/src")


class PortageBackend(PackageBackend):

    @property
    def name(self) -> str:
        return "portage"

    def install_packages(self, packages: list[str]) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["emerge", "--ask=n", "--quiet-build"] + packages
        )

    def install_local(self, path: str) -> Iterator[str]:
        # Portage doesn't install arbitrary binary packages; delegate to
        # a manual unpack with a clear message.
        yield f"Portage does not support binary package install from {path}.\n"
        yield "Use 'lkm build' to compile from source on Gentoo.\n"

    def remove_packages(self, packages: list[str], purge: bool = False) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        flags = ["--depclean"] if purge else ["--unmerge"]
        yield from self._run_streaming(
            priv + ["emerge"] + flags + packages
        )

    def hold(self, packages: list[str]) -> tuple[int, str, str]:
        # Write package.mask entries
        priv = privilege_escalation_cmd()
        mask_dir = Path("/etc/portage/package.mask")
        mask_dir.mkdir(parents=True, exist_ok=True)
        mask_file = mask_dir / "lkm-held"
        existing = mask_file.read_text() if mask_file.exists() else ""
        new_entries = "\n".join(f"={p}" for p in packages if f"={p}" not in existing)
        if new_entries:
            return self._run(
                priv + ["tee", "-a", str(mask_file)],
                input=new_entries + "\n",
            )
        return 0, "", ""

    def unhold(self, packages: list[str]) -> tuple[int, str, str]:
        import re
        mask_file = Path("/etc/portage/package.mask/lkm-held")
        if not mask_file.exists():
            return 0, "", ""
        text = mask_file.read_text()
        for pkg in packages:
            text = re.sub(rf"^={re.escape(pkg)}\n?", "", text, flags=re.MULTILINE)
        priv = privilege_escalation_cmd()
        return self._run(priv + ["tee", str(mask_file)], input=text)

    def is_installed(self, package: str) -> bool:
        rc, _, _ = self._run(["qlist", "-I", package])
        return rc == 0

    # ------------------------------------------------------------------
    # Gentoo-specific helpers used by the Gentoo provider
    # ------------------------------------------------------------------

    def list_kernel_sources(self) -> list[str]:
        """Return paths to installed kernel source trees under /usr/src."""
        if not _KERNEL_SOURCES_DIR.exists():
            return []
        return sorted(
            str(p) for p in _KERNEL_SOURCES_DIR.iterdir()
            if p.is_dir() and p.name.startswith("linux-")
        )

    def has_genkernel(self) -> bool:
        return bool(shutil.which("genkernel"))

    def compile(self, src: str, use_genkernel: bool, jobs: int) -> Iterator[str]:
        """Stream kernel compilation output."""
        priv = privilege_escalation_cmd()
        if use_genkernel:
            yield from self._run_streaming(
                priv + ["genkernel", "--kernel-config=/proc/config.gz", "all"],
                cwd=src,
            )
        else:
            j = jobs if jobs > 0 else os.cpu_count() or 1
            yield from self._run_streaming(
                priv + ["make", f"-j{j}"],
                cwd=src,
            )
            yield from self._run_streaming(
                priv + ["make", "modules_install"],
                cwd=src,
            )
            yield from self._run_streaming(
                priv + ["make", "install"],
                cwd=src,
            )
