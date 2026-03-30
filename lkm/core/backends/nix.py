"""
nix backend — NixOS.

NixOS manages kernels declaratively via /etc/nixos/configuration.nix (channels)
or a flake.nix (flakes).  This backend:

  - Detects whether the system uses channels or flakes.
  - Patches boot.kernelPackages in the appropriate config file.
  - Runs nixos-rebuild switch to apply the change.
  - Hold/unhold explains flake input pinning rather than silently failing.
"""
from __future__ import annotations

import os
import re
import shutil
import tempfile
from collections.abc import Iterator
from pathlib import Path

from lkm.core.backends.base import PackageBackend
from lkm.core.system import privilege_escalation_cmd

_NIXPKGS_KERNEL_ATTRS = {
    "linuxPackages", "linuxPackages_latest", "linuxPackages_6_6",
    "linuxPackages_6_1", "linuxPackages_5_15", "linuxPackages_rt",
    "linuxPackages_hardened", "linuxPackages_zen",
    "linuxPackages_xanmod", "linuxPackages_xanmod_latest",
}

_NIXOS_CONFIG = Path("/etc/nixos/configuration.nix")
_NIXOS_FLAKE  = Path("/etc/nixos/flake.nix")

_KERNEL_PKG_RE = re.compile(
    r"(boot\.kernelPackages\s*=\s*)([^;]+)(;)",
    re.MULTILINE,
)


def _is_flake_system() -> bool:
    return _NIXOS_FLAKE.exists()


def _config_path() -> Path:
    return _NIXOS_FLAKE if _is_flake_system() else _NIXOS_CONFIG


def _read_config(path: Path) -> str:
    try:
        return path.read_text()
    except OSError:
        return ""


def _write_config(path: Path, text: str) -> tuple[int, str, str]:
    priv = privilege_escalation_cmd()
    with tempfile.NamedTemporaryFile("w", suffix=".nix", delete=False) as f:
        f.write(text)
        tmp = f.name
    import subprocess
    result = subprocess.run(priv + ["cp", tmp, str(path)], capture_output=True, text=True)
    os.unlink(tmp)
    return result.returncode, result.stdout, result.stderr


def _patch_kernel_attr(text: str, new_attr: str) -> tuple[str, bool]:
    """Replace boot.kernelPackages = <old>; or insert it if absent."""
    if _KERNEL_PKG_RE.search(text):
        patched = _KERNEL_PKG_RE.sub(lambda m: m.group(1) + new_attr + m.group(3), text)
        return patched, patched != text
    insert = f"\n  boot.kernelPackages = {new_attr};\n"
    idx = text.rfind("}")
    if idx == -1:
        return text + insert, True
    return text[:idx] + insert + text[idx:], True


def _nixpkgs_attr_for(package_name: str) -> str:
    """Convert a package name / version string to a pkgs.linuxPackages_* expression."""
    if package_name.startswith("pkgs."):
        return package_name
    if package_name in _NIXPKGS_KERNEL_ATTRS:
        return f"pkgs.{package_name}"
    m = re.match(r"^(\d+)\.(\d+)", package_name)
    if m:
        return f"pkgs.linuxPackages_{m.group(1)}_{m.group(2)}"
    return f"pkgs.{package_name}"


class NixBackend(PackageBackend):

    @property
    def name(self) -> str:
        return "nix"

    @staticmethod
    def available() -> bool:
        return bool(shutil.which("nixos-rebuild") or shutil.which("nix-env"))

    @staticmethod
    def is_nixos() -> bool:
        try:
            return "nixos" in open("/etc/os-release").read().lower()
        except OSError:
            return False

    @staticmethod
    def is_flake() -> bool:
        return _is_flake_system()

    def install_packages(self, packages: list[str]) -> Iterator[str]:
        if not packages:
            return
        attr  = _nixpkgs_attr_for(packages[0])
        cfg   = _config_path()
        text  = _read_config(cfg)
        if not text:
            yield f"Cannot read {cfg} — is this NixOS?\n"
            yield f"  boot.kernelPackages = {attr};\n"
            return
        patched, changed = _patch_kernel_attr(text, attr)
        if not changed:
            yield f"boot.kernelPackages already set to {attr} in {cfg}\n"
        else:
            yield f"Patching {cfg}: boot.kernelPackages = {attr}\n"
            rc, _, err = _write_config(cfg, patched)
            if rc != 0:
                yield f"Failed to write {cfg}: {err}\n"
                yield f"Apply manually: boot.kernelPackages = {attr};\n"
                return
            yield f"Written {cfg}\n"
        yield from self._rebuild()

    def install_local(self, path: str) -> Iterator[str]:
        yield f"Adding {path} to the Nix store...\n"
        if shutil.which("nix-store"):
            priv = privilege_escalation_cmd()
            yield from self._run_streaming(priv + ["nix-store", "--add-fixed", "sha256", path])
        yield f"Add the store path to boot.kernelPackages in {_config_path()}\n"
        yield "Then run: sudo nixos-rebuild switch\n"

    def remove_packages(self, packages: list[str], purge: bool = False) -> Iterator[str]:
        yield f"Reverting boot.kernelPackages to pkgs.linuxPackages in {_config_path()}\n"
        yield from self.install_packages(["linuxPackages"])

    def hold(self, packages: list[str]) -> tuple[int, str, str]:
        if _is_flake_system():
            msg = (
                "NixOS (flakes): pin nixpkgs to a specific revision in flake.lock:\n"
                "  nix flake lock --update-input nixpkgs "
                "--override-input nixpkgs github:NixOS/nixpkgs/<commit>\n"
            )
        else:
            msg = (
                "NixOS (channels): pin to a fixed channel URL:\n"
                "  sudo nix-channel --add "
                "https://releases.nixos.org/nixos/<version>/nixos-<version> nixos\n"
                "  sudo nix-channel --update\n"
            )
        return 0, msg, ""

    def unhold(self, packages: list[str]) -> tuple[int, str, str]:
        if _is_flake_system():
            msg = "NixOS (flakes): unpin by running: nix flake update\n"
        else:
            msg = (
                "NixOS (channels): unpin by switching back to the rolling channel:\n"
                "  sudo nix-channel --add https://nixos.org/channels/nixos-unstable nixos\n"
                "  sudo nix-channel --update\n"
            )
        return 0, msg, ""

    def is_installed(self, package: str) -> bool:
        attr    = _nixpkgs_attr_for(package).replace("pkgs.", "")
        current = self.current_kernel_attr()
        return bool(current) and attr in current

    def current_kernel_attr(self) -> str:
        text = _read_config(_config_path())
        m = _KERNEL_PKG_RE.search(text)
        return m.group(2).strip() if m else ""

    def list_available_kernels(self) -> list[str]:
        rc, out, _ = self._run(["nix-env", "-qaP", "--no-name", "linuxPackages"])
        if rc != 0:
            return list(_NIXPKGS_KERNEL_ATTRS)
        return [line.strip() for line in out.splitlines() if "linuxPackages" in line]

    def _rebuild(self) -> Iterator[str]:
        if not shutil.which("nixos-rebuild"):
            yield "nixos-rebuild not found — run: sudo nixos-rebuild switch\n"
            return
        priv = privilege_escalation_cmd()
        yield "Running nixos-rebuild switch...\n"
        yield from self._run_streaming(priv + ["nixos-rebuild", "switch"])
