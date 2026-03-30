"""pacman backend — Arch, Manjaro, EndeavourOS, CachyOS, and derivatives."""
from __future__ import annotations

from typing import Iterator

from lkm.core.backends.base import PackageBackend
from lkm.core.system import privilege_escalation_cmd


class PacmanBackend(PackageBackend):

    @property
    def name(self) -> str:
        return "pacman"

    def install_packages(self, packages: list[str]) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["pacman", "-S", "--noconfirm", "--needed"] + packages
        )

    def install_local(self, path: str) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["pacman", "-U", "--noconfirm", path]
        )

    def remove_packages(self, packages: list[str], purge: bool = False) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        flags = ["-Rns"] if purge else ["-R"]
        yield from self._run_streaming(
            priv + ["pacman"] + flags + ["--noconfirm"] + packages
        )

    def hold(self, packages: list[str]) -> tuple[int, str, str]:
        # pacman uses IgnorePkg in /etc/pacman.conf; we append to it
        import re
        priv = privilege_escalation_cmd()
        conf = "/etc/pacman.conf"
        try:
            text = open(conf).read()
        except OSError as e:
            return 1, "", str(e)
        pkg_str = " ".join(packages)
        if "IgnorePkg" in text:
            text = re.sub(
                r"(IgnorePkg\s*=\s*)(.*)",
                lambda m: m.group(1) + (m.group(2) + " " + pkg_str).strip(),
                text,
            )
        else:
            text = text.replace("[options]", f"[options]\nIgnorePkg = {pkg_str}", 1)
        import tempfile, subprocess
        with tempfile.NamedTemporaryFile("w", suffix=".conf", delete=False) as f:
            f.write(text)
            tmp = f.name
        rc, out, err = self._run(priv + ["cp", tmp, conf])
        return rc, out, err

    def unhold(self, packages: list[str]) -> tuple[int, str, str]:
        import re
        priv = privilege_escalation_cmd()
        conf = "/etc/pacman.conf"
        try:
            text = open(conf).read()
        except OSError as e:
            return 1, "", str(e)
        for pkg in packages:
            text = re.sub(rf"\b{re.escape(pkg)}\b\s*", "", text)
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".conf", delete=False) as f:
            f.write(text)
            tmp = f.name
        return self._run(priv + ["cp", tmp, conf])

    def is_installed(self, package: str) -> bool:
        rc, _, _ = self._run(["pacman", "-Q", package])
        return rc == 0
