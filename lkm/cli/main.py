"""
lkm CLI entry point.

Combines ukm's runtime management commands with lkf's build pipeline,
all accessible from a single `lkm` command.

Usage:
  lkm list [--family=<f>] [--installed] [--json] [--refresh]
  lkm install <version> [--flavor=<f>] [--provider=<p>]
  lkm install --local <path>
  lkm remove <version> [--purge]
  lkm hold <version>
  lkm unhold <version>
  lkm note <version> <text>
  lkm remove-old [--keep=<n>] [--purge]
  lkm providers
  lkm info
  lkm build [--version=<v>] [--flavor=<f>] [--arch=<a>] [--llvm] [--lto=<t>]
             [--output=<fmt>] [--install]
  lkm remix [--file=<path>] [--install]
  lkm (-h | --help)
  lkm --version
"""
from __future__ import annotations

import sys

from lkm.core.manager import KernelManager
from lkm.core.system import system_info
from lkm.cli.output import ok, warn, err, die, header, print_json, print_table


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _stream(gen, label: str = "") -> None:
    """Print streamed log lines from a generator, exit on RuntimeError."""
    try:
        for line in gen:
            print(line, end="", flush=True)
    except RuntimeError as e:
        die(str(e))


def _find_entry(mgr: KernelManager, version: str, flavor: str | None = None,
                provider: str | None = None):
    entries = mgr.list_all()
    matches = [
        e for e in entries
        if str(e.version) == version
        and (flavor is None or e.flavor == flavor)
        and (provider is None or e.provider_id == provider)
    ]
    if not matches:
        die(f"No kernel found matching version={version!r}"
            + (f" flavor={flavor!r}" if flavor else "")
            + (f" provider={provider!r}" if provider else ""))
    if len(matches) > 1:
        warn(f"{len(matches)} kernels match; using first. Use --flavor/--provider to narrow.")
    return matches[0]


# ---------------------------------------------------------------------------
# Sub-commands
# ---------------------------------------------------------------------------

def cmd_list(args: dict) -> None:
    mgr     = KernelManager()
    refresh = args.get("--refresh", False)
    as_json = args.get("--json", False)
    family  = args.get("--family")
    installed_only = args.get("--installed", False)

    entries = mgr.list_all(refresh=refresh)
    if family:
        entries = [e for e in entries if e.family.value == family]
    if installed_only:
        entries = [e for e in entries if e.is_installed]

    if as_json:
        print_json([{
            "version":  str(e.version),
            "family":   e.family.value,
            "flavor":   e.flavor,
            "arch":     e.arch,
            "provider": e.provider_id,
            "status":   e.status.value,
            "held":     e.held,
            "notes":    e.notes,
        } for e in entries])
        return

    if not entries:
        print("No kernels found.")
        return

    rows = [[
        str(e.version),
        e.family.value,
        e.flavor,
        e.arch,
        e.status.value + (" [held]" if e.held else ""),
        e.notes[:40] if e.notes else "",
    ] for e in entries]
    print_table(rows, ["Version", "Family", "Flavor", "Arch", "Status", "Notes"])


def cmd_install(args: dict) -> None:
    mgr = KernelManager()

    if w := mgr.secure_boot_warning():
        warn(w)
    if w := mgr.nixos_build_warning():
        warn(w)

    local_path = args.get("--local")
    if local_path:
        _stream(mgr.install_local(local_path))
        ok(f"Installed from {local_path}")
        return

    version  = args["<version>"]
    flavor   = args.get("--flavor")
    provider = args.get("--provider")
    entry    = _find_entry(mgr, version, flavor, provider)
    _stream(mgr.install(entry))
    ok(f"Installed {entry.display_name}")


def cmd_remove(args: dict) -> None:
    mgr   = KernelManager()
    entry = _find_entry(mgr, args["<version>"])
    purge = args.get("--purge", False)
    _stream(mgr.remove(entry, purge=purge))
    ok(f"Removed {entry.display_name}")


def cmd_hold(args: dict) -> None:
    mgr   = KernelManager()
    entry = _find_entry(mgr, args["<version>"])
    rc, out, err_msg = mgr.hold(entry)
    if rc != 0:
        die(f"hold failed: {err_msg}")
    ok(f"Held {entry.display_name}")


def cmd_unhold(args: dict) -> None:
    mgr   = KernelManager()
    entry = _find_entry(mgr, args["<version>"])
    rc, out, err_msg = mgr.unhold(entry)
    if rc != 0:
        die(f"unhold failed: {err_msg}")
    ok(f"Unheld {entry.display_name}")


def cmd_note(args: dict) -> None:
    mgr   = KernelManager()
    entry = _find_entry(mgr, args["<version>"])
    mgr.set_note(entry, args["<text>"])
    ok(f"Note set on {entry.display_name}")


def cmd_remove_old(args: dict) -> None:
    mgr  = KernelManager()
    keep = int(args.get("--keep") or 1)
    purge = args.get("--purge", False)
    _stream(mgr.remove_old(keep=keep, purge=purge))


def cmd_providers(args: dict) -> None:
    mgr = KernelManager()
    header("Available providers")
    rows = [[p.id, p.display_name, p.family.value,
             ", ".join(p.supported_arches)]
            for p in mgr.providers]
    print_table(rows, ["ID", "Name", "Family", "Arches"])


def cmd_info(args: dict) -> None:
    info = system_info()
    header("System info")
    rows = [
        ["Distro",          info.distro.name],
        ["Distro ID",       info.distro.id],
        ["Family",          info.distro.family.value],
        ["Architecture",    f"{info.arch} ({info.arch_raw})"],
        ["Package manager", info.package_manager.value],
        ["Running kernel",  info.running_kernel],
        ["Secure Boot",     "yes" if info.has_secure_boot else "no"],
        ["In nix-shell",    "yes" if info.in_nix_shell else "no"],
    ]
    print_table(rows, ["Property", "Value"])


def cmd_build(args: dict) -> None:
    """Drive lkf build directly from the CLI."""
    mgr  = KernelManager()
    lkf  = mgr.lkf_provider
    if lkf is None:
        die("lkf is not installed. Cannot build kernels.")

    if w := mgr.nixos_build_warning():
        warn(w)

    version = args.get("--version") or die("--version is required for lkm build")
    flavor  = args.get("--flavor", "mainline")
    arch    = args.get("--arch")
    llvm    = args.get("--llvm", False)
    lto     = args.get("--lto", "none")
    fmt     = args.get("--output", "deb")
    install = args.get("--install", False)

    header(f"Building kernel {version} ({flavor})")
    _stream(lkf.build_custom(
        version=version,
        flavor=flavor,
        arch=arch,
        llvm=llvm,
        lto=lto,
        output_fmt=fmt,
    ))
    ok("Build complete.")

    if install:
        from lkm.core.providers.lkf_build import _find_output_package
        pkg = _find_output_package(lkf.output_dir, version)
        if pkg is None:
            die(f"Build succeeded but no package found in {lkf.output_dir}")
        header(f"Installing {pkg.name}")
        _stream(mgr.install_local(str(pkg)))
        ok(f"Installed {pkg.name}")


def cmd_remix(args: dict) -> None:
    """Drive lkf remix from a profile file."""
    mgr  = KernelManager()
    lkf  = mgr.lkf_provider
    if lkf is None:
        die("lkf is not installed. Cannot build kernels.")

    if w := mgr.nixos_build_warning():
        warn(w)

    profile = args.get("--file") or die("--file is required for lkm remix")
    install = args.get("--install", False)

    header(f"Building from profile: {profile}")
    _stream(lkf.build_only(profile))
    ok("Build complete.")

    if install:
        from lkm.core.providers.lkf_build import _find_output_package
        pkg = _find_output_package(lkf.output_dir, "")
        if pkg is None:
            die(f"Build succeeded but no package found in {lkf.output_dir}")
        header(f"Installing {pkg.name}")
        _stream(mgr.install_local(str(pkg)))
        ok(f"Installed {pkg.name}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

_USAGE = __doc__


def main() -> None:
    try:
        from docopt import docopt
        args = docopt(_USAGE, version="lkm 0.1.0")
    except ImportError:
        # Minimal fallback parser when docopt is not installed
        args = _minimal_parse(sys.argv[1:])

    dispatch = {
        "list":       cmd_list,
        "install":    cmd_install,
        "remove":     cmd_remove,
        "hold":       cmd_hold,
        "unhold":     cmd_unhold,
        "note":       cmd_note,
        "remove-old": cmd_remove_old,
        "providers":  cmd_providers,
        "info":       cmd_info,
        "build":      cmd_build,
        "remix":      cmd_remix,
    }

    for cmd, fn in dispatch.items():
        if args.get(cmd):
            fn(args)
            return

    print(_USAGE)


def _minimal_parse(argv: list[str]) -> dict:
    """Bare-minimum arg parser used when docopt is unavailable."""
    if not argv:
        print(_USAGE)
        sys.exit(0)
    cmd = argv[0]
    d: dict = {cmd: True}
    i = 1
    while i < len(argv):
        a = argv[i]
        if a.startswith("--"):
            if "=" in a:
                k, v = a[2:].split("=", 1)
                d[f"--{k}"] = v
            elif i + 1 < len(argv) and not argv[i + 1].startswith("--"):
                d[a] = argv[i + 1]
                i += 1
            else:
                d[a] = True
        elif not a.startswith("-"):
            d.setdefault("<version>", a) if "<version>" not in d else d.setdefault("<text>", a)
        i += 1
    return d


if __name__ == "__main__":
    main()
