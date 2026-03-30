"""
nix backend — NixOS.

NixOS manages kernels declaratively via /etc/nixos/configuration.nix.
Direct imperative install/remove of kernels is not idiomatic and will be
overwritten on the next `nixos-rebuild switch`.

This backend therefore takes a pragmatic approach:
  - install_packages / install_local: emit a configuration snippet the user
    should add to configuration.nix, then optionally run nixos-rebuild switch.
  - remove_packages: same pattern — emit a snippet and rebuild.
  - hold/unhold: no-op with an explanation (NixOS pinning is done via flake
    inputs or fetchTarball with a fixed hash).

For lkf-built kernels, the recommended path on NixOS is to use the lkf nix/
shell.nix / flake.nix environment for building, then reference the result
store path in configuration.nix.  lkm surfaces that path after a build.
"""
from __future__ import annotations

import shutil
from typing import Iterator

from lkm.core.backends.base import PackageBackend
from lkm.core.system import privilege_escalation_cmd


_NIXOS_REBUILD_HINT = (
    "Add the kernel to /etc/nixos/configuration.nix, then run:\n"
    "  sudo nixos-rebuild switch\n"
)


class NixBackend(PackageBackend):

    @property
    def name(self) -> str:
        return "nix"

    # ------------------------------------------------------------------
    # Availability guard
    # ------------------------------------------------------------------

    @staticmethod
    def available() -> bool:
        return bool(shutil.which("nix-env") or shutil.which("nixos-rebuild"))

    @staticmethod
    def is_nixos() -> bool:
        try:
            return "nixos" in open("/etc/os-release").read().lower()
        except OSError:
            return False

    # ------------------------------------------------------------------
    # Core operations
    # ------------------------------------------------------------------

    def install_packages(self, packages: list[str]) -> Iterator[str]:
        """
        On NixOS, kernel selection is declarative.  Emit the configuration
        snippet and, if nixos-rebuild is available, offer to apply it.
        """
        for pkg in packages:
            yield f"NixOS: to use kernel '{pkg}', add to /etc/nixos/configuration.nix:\n"
            yield f"  boot.kernelPackages = pkgs.linuxPackages_{pkg.replace('-', '_')};\n"
        yield _NIXOS_REBUILD_HINT
        # Attempt an actual rebuild if the caller is running as root / with sudo
        if shutil.which("nixos-rebuild"):
            yield "Running nixos-rebuild switch...\n"
            priv = privilege_escalation_cmd()
            yield from self._run_streaming(priv + ["nixos-rebuild", "switch"])

    def install_local(self, path: str) -> Iterator[str]:
        """
        For a locally built kernel (e.g. from lkf), copy the store path into
        the Nix store and emit the configuration snippet.
        """
        yield f"NixOS: installing local kernel from {path}\n"
        if shutil.which("nix-store"):
            priv = privilege_escalation_cmd()
            yield from self._run_streaming(
                priv + ["nix-store", "--add-fixed", "sha256", path]
            )
        yield "Add the resulting store path to boot.kernelPackages in configuration.nix.\n"
        yield _NIXOS_REBUILD_HINT

    def remove_packages(self, packages: list[str], purge: bool = False) -> Iterator[str]:
        for pkg in packages:
            yield f"NixOS: to remove kernel '{pkg}', update boot.kernelPackages in\n"
            yield "  /etc/nixos/configuration.nix and run: sudo nixos-rebuild switch\n"
        yield _NIXOS_REBUILD_HINT

    def hold(self, packages: list[str]) -> tuple[int, str, str]:
        msg = (
            "NixOS: kernel pinning is done via flake inputs or fetchTarball with a "
            "fixed hash in configuration.nix.  lkm cannot manage this imperatively.\n"
        )
        return 0, msg, ""

    def unhold(self, packages: list[str]) -> tuple[int, str, str]:
        return self.hold(packages)

    def is_installed(self, package: str) -> bool:
        # Check if the kernel is the currently booted one or in the system profile
        rc, out, _ = self._run(["nix-env", "-q", "--installed", package])
        return rc == 0 and package in out

    # ------------------------------------------------------------------
    # NixOS-specific helpers
    # ------------------------------------------------------------------

    def list_available_kernels(self) -> list[str]:
        """Return kernel package names available in nixpkgs."""
        rc, out, _ = self._run(
            ["nix-env", "-qaP", "--no-name", "linuxPackages"]
        )
        if rc != 0:
            return []
        return [line.strip() for line in out.splitlines() if "linuxPackages" in line]

    def current_kernel_attr(self) -> str:
        """
        Return the current boot.kernelPackages attribute from configuration.nix,
        or an empty string if it cannot be determined.
        """
        try:
            text = open("/etc/nixos/configuration.nix").read()
            import re
            m = re.search(r"boot\.kernelPackages\s*=\s*([^;]+);", text)
            return m.group(1).strip() if m else ""
        except OSError:
            return ""
