"""
System detection: distro, architecture, package manager, running kernel.

All detection is lazy and cached. Call system_info() to get a SystemInfo
snapshot; it is safe to call multiple times (returns the same object).

Extended from ukm to add NixOS and Void Linux (xbps) support.
"""
from __future__ import annotations

import os
import platform
import shutil
import subprocess
from dataclasses import dataclass, field
from enum import Enum
from functools import lru_cache
from pathlib import Path


class PackageManagerKind(Enum):
    APT     = "apt"      # Debian / Ubuntu / Mint / etc.
    PACMAN  = "pacman"   # Arch / Manjaro / EndeavourOS / CachyOS / etc.
    DNF     = "dnf"      # Fedora / RHEL / AlmaLinux / Rocky / etc.
    ZYPPER  = "zypper"   # openSUSE
    APK     = "apk"      # Alpine
    PORTAGE = "portage"  # Gentoo
    XBPS    = "xbps"     # Void Linux
    NIX     = "nix"      # NixOS
    UNKNOWN = "unknown"


class DistroFamily(Enum):
    DEBIAN  = "debian"
    ARCH    = "arch"
    FEDORA  = "fedora"
    SUSE    = "suse"
    ALPINE  = "alpine"
    GENTOO  = "gentoo"
    VOID    = "void"
    NIXOS   = "nixos"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class DistroInfo:
    id:       str
    id_like:  list[str] = field(default_factory=list)
    name:     str = ""
    version:  str = ""
    codename: str = ""
    family:   DistroFamily = DistroFamily.UNKNOWN


@dataclass(frozen=True)
class SystemInfo:
    distro:         DistroInfo
    arch:           str   # normalised: amd64, arm64, armhf, riscv64, ppc64el, s390x, i386
    arch_raw:       str   # as reported by uname -m
    package_manager: PackageManagerKind
    running_kernel: str   # uname -r output
    has_secure_boot: bool
    has_pkexec:     bool
    has_sudo:       bool
    in_nix_shell:   bool  # True when inside nix-shell / nix develop


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _read_os_release() -> dict[str, str]:
    result: dict[str, str] = {}
    for path in ("/etc/os-release", "/usr/lib/os-release"):
        try:
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if "=" not in line or line.startswith("#"):
                        continue
                    k, _, v = line.partition("=")
                    result[k.strip()] = v.strip().strip('"')
            break
        except FileNotFoundError:
            continue
    return result


def _detect_distro() -> DistroInfo:
    data = _read_os_release()
    distro_id = data.get("ID", "").lower()
    id_like   = [x.lower() for x in data.get("ID_LIKE", "").split()]
    all_ids   = {distro_id} | set(id_like)

    if distro_id == "nixos" or "nixos" in all_ids:
        family = DistroFamily.NIXOS
    elif distro_id == "void" or "void" in all_ids:
        family = DistroFamily.VOID
    elif any(x in all_ids for x in (
        "debian", "ubuntu", "linuxmint", "pop", "elementary",
        "kali", "parrot", "devuan", "raspbian", "mx",
        "antix", "zorin", "sparky", "bunsenlabs",
    )):
        family = DistroFamily.DEBIAN
    elif any(x in all_ids for x in (
        "arch", "manjaro", "endeavouros", "cachyos",
        "artix", "garuda", "rebornos", "archcraft",
    )):
        family = DistroFamily.ARCH
    elif any(x in all_ids for x in (
        "fedora", "rhel", "centos", "almalinux",
        "rocky", "nobara", "ultramarine", "oracle",
    )):
        family = DistroFamily.FEDORA
    elif any(x in all_ids for x in ("opensuse", "suse", "sles")):
        family = DistroFamily.SUSE
    elif "alpine" in all_ids:
        family = DistroFamily.ALPINE
    elif "gentoo" in all_ids:
        family = DistroFamily.GENTOO
    else:
        family = DistroFamily.UNKNOWN

    return DistroInfo(
        id=distro_id,
        id_like=id_like,
        name=data.get("NAME", distro_id),
        version=data.get("VERSION_ID", ""),
        codename=data.get("VERSION_CODENAME", ""),
        family=family,
    )


def _normalise_arch(raw: str) -> str:
    """Map uname -m values to Debian-style arch names used throughout penguins-kernel-manager."""
    mapping = {
        "x86_64":  "amd64",
        "aarch64": "arm64",
        "armv7l":  "armhf",
        "armv6l":  "armel",
        "i686":    "i386",
        "i386":    "i386",
        "riscv64": "riscv64",
        "ppc64le": "ppc64el",
        "s390x":   "s390x",
    }
    return mapping.get(raw, raw)


def _detect_package_manager(family: DistroFamily) -> PackageManagerKind:
    # Explicit binary detection takes priority over family inference so that
    # distros with unusual setups (e.g. Arch with apt installed) still work.
    checks = [
        ("apt-get",      PackageManagerKind.APT),
        ("pacman",       PackageManagerKind.PACMAN),
        ("dnf",          PackageManagerKind.DNF),
        ("zypper",       PackageManagerKind.ZYPPER),
        ("apk",          PackageManagerKind.APK),
        ("emerge",       PackageManagerKind.PORTAGE),
        ("xbps-install", PackageManagerKind.XBPS),
        ("nix-env",      PackageManagerKind.NIX),
    ]
    for cmd, kind in checks:
        if shutil.which(cmd):
            return kind

    _family_map = {
        DistroFamily.DEBIAN:  PackageManagerKind.APT,
        DistroFamily.ARCH:    PackageManagerKind.PACMAN,
        DistroFamily.FEDORA:  PackageManagerKind.DNF,
        DistroFamily.SUSE:    PackageManagerKind.ZYPPER,
        DistroFamily.ALPINE:  PackageManagerKind.APK,
        DistroFamily.GENTOO:  PackageManagerKind.PORTAGE,
        DistroFamily.VOID:    PackageManagerKind.XBPS,
        DistroFamily.NIXOS:   PackageManagerKind.NIX,
    }
    return _family_map.get(family, PackageManagerKind.UNKNOWN)


def _detect_secure_boot() -> bool:
    if shutil.which("mokutil"):
        try:
            result = subprocess.run(
                ["mokutil", "--sb-state"],
                capture_output=True, text=True, timeout=3,
            )
            return "enabled" in result.stdout.lower()
        except Exception:
            pass
    sb_var = Path(
        "/sys/firmware/efi/efivars/"
        "SecureBoot-8be4df61-93ca-11d2-aa0d-00e098032b8c"
    )
    if sb_var.exists():
        try:
            data = sb_var.read_bytes()
            return len(data) >= 5 and data[4] == 1
        except Exception:
            pass
    return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def system_info() -> SystemInfo:
    """Return a cached SystemInfo for the current machine."""
    distro   = _detect_distro()
    arch_raw = platform.machine()
    arch     = _normalise_arch(arch_raw)
    pm       = _detect_package_manager(distro.family)

    return SystemInfo(
        distro=distro,
        arch=arch,
        arch_raw=arch_raw,
        package_manager=pm,
        running_kernel=platform.release(),
        has_secure_boot=_detect_secure_boot(),
        has_pkexec=bool(shutil.which("pkexec")),
        has_sudo=bool(shutil.which("sudo")),
        in_nix_shell=bool(os.environ.get("IN_NIX_SHELL") or os.environ.get("LKM_NIX_SHELL")),
    )


def privilege_escalation_cmd() -> list[str]:
    """Return the best available privilege escalation prefix."""
    info = system_info()
    if info.has_pkexec:
        return ["pkexec"]
    if info.has_sudo:
        return ["sudo"]
    return []
