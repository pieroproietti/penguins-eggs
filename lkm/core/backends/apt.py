"""apt/dpkg backend — Debian, Ubuntu, Mint, Pop!_OS, Kali, and derivatives."""
from __future__ import annotations

from collections.abc import Iterator

from lkm.core.backends.base import PackageBackend
from lkm.core.system import privilege_escalation_cmd


class AptBackend(PackageBackend):

    @property
    def name(self) -> str:
        return "apt"

    def install_packages(self, packages: list[str]) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        yield from self._run_streaming(
            priv + ["apt-get", "install", "-y", "--no-install-recommends"] + packages,
            env={"DEBIAN_FRONTEND": "noninteractive", **__import__("os").environ},
        )

    def install_local(self, path: str) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        # dpkg -i then apt-get -f install to resolve any missing deps
        yield from self._run_streaming(priv + ["dpkg", "-i", path])
        yield from self._run_streaming(
            priv + ["apt-get", "install", "-f", "-y"],
            env={"DEBIAN_FRONTEND": "noninteractive", **__import__("os").environ},
        )

    def remove_packages(self, packages: list[str], purge: bool = False) -> Iterator[str]:
        priv = privilege_escalation_cmd()
        verb = "purge" if purge else "remove"
        yield from self._run_streaming(
            priv + ["apt-get", verb, "-y"] + packages,
            env={"DEBIAN_FRONTEND": "noninteractive", **__import__("os").environ},
        )

    def hold(self, packages: list[str]) -> tuple[int, str, str]:
        priv = privilege_escalation_cmd()
        specs = [f"{p} hold" for p in packages]
        return self._run(priv + ["dpkg", "--set-selections"],
                         input="\n".join(specs) + "\n")

    def unhold(self, packages: list[str]) -> tuple[int, str, str]:
        priv = privilege_escalation_cmd()
        specs = [f"{p} install" for p in packages]
        return self._run(priv + ["dpkg", "--set-selections"],
                         input="\n".join(specs) + "\n")

    def is_installed(self, package: str) -> bool:
        rc, out, _ = self._run(["dpkg-query", "-W", "-f=${Status}", package])
        return rc == 0 and "install ok installed" in out

    def has_apt_key(self, key_url: str) -> bool:
        """Return True if the signing key at key_url is already trusted."""
        rc, _, _ = self._run(["apt-key", "list"])
        return rc == 0

    def add_apt_repo(self, repo_line: str, key_url: str) -> Iterator[str]:
        """Add an apt repository and its signing key."""
        import tempfile
        priv = privilege_escalation_cmd()
        # Download and add key
        with tempfile.NamedTemporaryFile(suffix=".gpg", delete=False) as f:
            tmp = f.name
        yield from self._run_streaming(["curl", "-fsSL", key_url, "-o", tmp])
        yield from self._run_streaming(
            priv + ["gpg", "--dearmor", "-o",
                    f"/usr/share/keyrings/{tmp.split('/')[-1]}", tmp]
        )
        # Add repo
        yield from self._run_streaming(
            priv + ["add-apt-repository", "-y", repo_line]
        )
        yield from self._run_streaming(priv + ["apt-get", "update", "-q"])
