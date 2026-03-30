"""
LkfBuild provider — the lkf → lkm integration bridge.

This provider wraps the lkf shell framework.  It:

  1. Discovers lkf profiles (remix.toml files) from the lkf installation.
  2. Exposes each profile as a KernelEntry with family=LKF_BUILD.
  3. Drives `lkf build` (or `lkf remix`) as a subprocess, streaming output.
  4. On completion, locates the output package and hands it to LocalFileProvider
     for installation via the system package manager.

The lkf root is resolved in this order:
  - LKF_ROOT environment variable
  - ~/.local/share/lkf
  - /usr/local/share/lkf
  - /usr/share/lkf
  - lkf on PATH (used to derive root via `lkf info --root`)

Build output lands in LKF_OUTPUT_DIR (default: ~/.cache/lkm/lkf-output/).
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from collections.abc import Iterator, Sequence
from pathlib import Path

from lkm.core.kernel import KernelEntry, KernelFamily, KernelStatus, KernelVersion
from lkm.core.providers.base import KernelProvider
from lkm.core.system import system_info

_DEFAULT_OUTPUT_DIR = Path.home() / ".cache" / "lkm" / "lkf-output"
_PROFILE_SEARCH_DIRS = [
    Path.home() / ".local" / "share" / "lkf" / "profiles",
    Path("/usr/local/share/lkf/profiles"),
    Path("/usr/share/lkf/profiles"),
]

# Package extensions produced by lkf, in preference order
_PKG_EXTENSIONS = [".deb", ".rpm", ".pkg.tar.zst", ".pkg.tar.xz", ".apk"]


def _find_lkf_bin() -> str | None:
    return shutil.which("lkf")


def _find_lkf_root() -> Path | None:
    if env := os.environ.get("LKF_ROOT"):
        p = Path(env)
        if p.exists():
            return p

    candidates = [
        Path.home() / ".local" / "share" / "lkf",
        Path("/usr/local/share/lkf"),
        Path("/usr/share/lkf"),
    ]
    for c in candidates:
        if (c / "lkf.sh").exists():
            return c

    # Ask lkf itself
    lkf = _find_lkf_bin()
    if lkf:
        try:
            out = subprocess.check_output(
                [lkf, "info", "--json"], text=True, timeout=5
            )
            data = json.loads(out)
            root = data.get("lkf_root")
            if root and Path(root).exists():
                return Path(root)
        except Exception:
            pass

    return None


def _find_profiles(lkf_root: Path | None) -> list[Path]:
    """Return all remix.toml profile files from known locations."""
    search = list(_PROFILE_SEARCH_DIRS)
    if lkf_root:
        search.insert(0, lkf_root / "profiles")

    found = []
    for d in search:
        if d.is_dir():
            found.extend(sorted(d.glob("*.toml")))
    return found


def _parse_profile_version(toml_path: Path) -> str:
    """Extract the version field from a remix.toml without a full TOML parser."""
    try:
        text = toml_path.read_text()
        m = re.search(r'^\s*version\s*=\s*"([^"]+)"', text, re.MULTILINE)
        return m.group(1) if m else "0.0.0"
    except OSError:
        return "0.0.0"


def _parse_profile_name(toml_path: Path) -> str:
    try:
        text = toml_path.read_text()
        m = re.search(r'^\s*name\s*=\s*"([^"]+)"', text, re.MULTILINE)
        return m.group(1) if m else toml_path.stem
    except OSError:
        return toml_path.stem


def _find_output_package(output_dir: Path, version: str) -> Path | None:
    """Locate the package file produced by lkf build in output_dir."""
    for ext in _PKG_EXTENSIONS:
        matches = list(output_dir.glob(f"*{version}*{ext}"))
        if matches:
            return matches[0]
    # Fallback: any package file
    for ext in _PKG_EXTENSIONS:
        matches = list(output_dir.glob(f"*{ext}"))
        if matches:
            return matches[0]
    return None


class LkfBuildProvider(KernelProvider):
    """
    Kernel provider backed by the lkf build framework.

    Each lkf profile (remix.toml) is surfaced as a buildable kernel.
    Building streams lkf output live; on success the resulting package is
    installed via the system backend.
    """

    def __init__(self, backend) -> None:
        super().__init__(backend)
        self._lkf_bin  = _find_lkf_bin()
        self._lkf_root = _find_lkf_root()
        self._output_dir = Path(
            os.environ.get("LKF_OUTPUT_DIR", str(_DEFAULT_OUTPUT_DIR))
        )

    @property
    def id(self) -> str:
        return "lkf_build"

    @property
    def display_name(self) -> str:
        return "Build with lkf"

    @property
    def family(self) -> KernelFamily:
        return KernelFamily.LKF_BUILD

    @property
    def supported_arches(self) -> list[str]:
        return ["*"]

    def is_available(self) -> bool:
        return self._lkf_bin is not None

    def availability_reason(self) -> str:
        return (
            "lkf is not installed or not on PATH.  "
            "Clone https://github.com/Interested-Deving-1896/lkf and run 'make install'."
        )

    # ------------------------------------------------------------------
    # Listing
    # ------------------------------------------------------------------

    def list(self, arch: str, refresh: bool = False) -> list[KernelEntry]:
        """Return one KernelEntry per discovered lkf profile."""
        profiles = _find_profiles(self._lkf_root)
        entries  = []
        for profile in profiles:
            ver_str  = _parse_profile_version(profile)
            name     = _parse_profile_name(profile)
            try:
                ver = KernelVersion.parse(ver_str)
            except ValueError:
                ver = KernelVersion(0, 0, 0, extra=f"-{name}")

            entries.append(KernelEntry(
                version=ver,
                family=self.family,
                flavor=name,
                arch=arch,
                provider_id=self.id,
                status=KernelStatus.AVAILABLE,
                local_path=str(profile),
            ))
        return entries

    # ------------------------------------------------------------------
    # Build + install
    # ------------------------------------------------------------------

    def install(self, entry: KernelEntry) -> Iterator[str]:
        """
        Build the kernel described by entry.local_path (a remix.toml),
        then install the resulting package via the system backend.
        """
        lkf_bin = self._lkf_bin
        if not lkf_bin:
            raise RuntimeError("lkf binary not found.")

        profile_path = entry.local_path
        if profile_path is None:
            raise RuntimeError(f"No profile path set on entry '{entry.flavor}'.")
        self._output_dir.mkdir(parents=True, exist_ok=True)

        yield f"Building kernel '{entry.flavor}' with lkf...\n"
        yield f"Profile: {profile_path}\n"
        yield f"Output:  {self._output_dir}\n\n"

        cmd = [
            lkf_bin, "remix",
            "--file", profile_path,
            "--output-dir", str(self._output_dir),
        ]

        # Stream lkf output
        with subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env={**os.environ, "LKF_ROOT": str(self._lkf_root or "")},
        ) as proc:
            assert proc.stdout is not None
            yield from proc.stdout
            proc.wait()
            if proc.returncode != 0:
                raise RuntimeError(
                    f"lkf build failed with exit code {proc.returncode}"
                )

        yield "\nlkf build complete. Locating output package...\n"

        pkg = _find_output_package(self._output_dir, str(entry.version))
        if pkg is None:
            raise RuntimeError(
                f"lkf build succeeded but no package file found in {self._output_dir}.\n"
                "Check that lkf is configured to produce a package (--output deb/rpm/etc.)."
            )

        yield f"Installing package: {pkg.name}\n"
        yield from self._backend.install_local(str(pkg))

    def remove(self, entry: KernelEntry, purge: bool = False) -> Iterator[str]:
        # Removal is the same as any installed kernel — delegate to backend
        pkg_name = f"linux-image-{entry.version}-lkf"
        yield from self._backend.remove_packages([pkg_name], purge=purge)

    # ------------------------------------------------------------------
    # Build-only (no install) — used by the GUI Build tab
    # ------------------------------------------------------------------

    def build_only(
        self,
        profile_path: str,
        extra_args: Sequence[str] | None = None,
    ) -> Iterator[str]:
        """
        Run lkf remix/build and stream output without installing.

        Yields log lines.  Raises RuntimeError on non-zero exit.
        """
        lkf_bin = self._lkf_bin
        if not lkf_bin:
            raise RuntimeError("lkf binary not found.")

        self._output_dir.mkdir(parents=True, exist_ok=True)
        cmd = [
            lkf_bin, "remix",
            "--file", profile_path,
            "--output-dir", str(self._output_dir),
            *( extra_args or []),
        ]

        with subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env={**os.environ, "LKF_ROOT": str(self._lkf_root or "")},
        ) as proc:
            assert proc.stdout is not None
            yield from proc.stdout
            proc.wait()
            if proc.returncode != 0:
                raise RuntimeError(
                    f"lkf exited with code {proc.returncode}"
                )

    def build_custom(
        self,
        version: str,
        flavor: str = "mainline",
        arch: str | None = None,
        llvm: bool = False,
        lto: str = "none",
        output_fmt: str = "deb",
        extra_args: Sequence[str] | None = None,
    ) -> Iterator[str]:
        """
        Drive `lkf build` directly (no profile file) and stream output.

        This is the path used by the GUI Build tab's "Custom build" mode.
        """
        lkf_bin = self._lkf_bin
        if not lkf_bin:
            raise RuntimeError("lkf binary not found.")

        self._output_dir.mkdir(parents=True, exist_ok=True)
        target_arch = arch or system_info().arch_raw

        cmd = [
            lkf_bin, "build",
            "--version", version,
            "--flavor",  flavor,
            "--arch",    target_arch,
            "--output",  output_fmt,
            "--output-dir", str(self._output_dir),
        ]
        if llvm:
            cmd.append("--llvm")
        if lto != "none":
            cmd += ["--lto", lto]
        cmd += list(extra_args or [])

        with subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env={**os.environ, "LKF_ROOT": str(self._lkf_root or "")},
        ) as proc:
            assert proc.stdout is not None
            yield from proc.stdout
            proc.wait()
            if proc.returncode != 0:
                raise RuntimeError(
                    f"lkf build exited with code {proc.returncode}"
                )

    @property
    def output_dir(self) -> Path:
        return self._output_dir
