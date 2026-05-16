#!/usr/bin/env python3
import argparse
import os
import sys

from py_oa_tools.pkg import cmd


def main():
    parser = argparse.ArgumentParser(
        prog="coa",
        description="Python rewrite of oa-tools coordinator (coa)",
    )
    parser.add_argument("--version", action="store_true", help="Show version and exit")

    subparsers = parser.add_subparsers(dest="command")

    remaster = subparsers.add_parser("remaster", help="Create a bootable live ISO from the Brain profile")
    remaster.add_argument("--mode", default="standard", help="standard, clone, or crypted")
    remaster.add_argument("--path", default="/home/eggs", help="Working directory for the remaster process")
    remaster.add_argument("--stop-after", default="", help="Stop after a named plan step")

    sysinstall = subparsers.add_parser("sysinstall", help="Run the system installer")
    sysinstall.add_argument("backend", choices=["calamares", "krill"], help="installer backend")

    subparsers.add_parser("detect", help="Detect and print host distro information")
    subparsers.add_parser("kill", help="Unmount the remastering workspace and clean logs")

    export_cmd = subparsers.add_parser("export", help="Export artifacts to remote storage")
    export_sub = export_cmd.add_subparsers(dest="export_subcommand")
    export_iso = export_sub.add_parser("iso", help="Export the latest ISO")
    export_iso.add_argument("--clean", action="store_true", help="Clean old files on remote before export")
    export_pkg = export_sub.add_parser("pkg", help="Export native packages")
    export_pkg.add_argument("--clean", action="store_true", help="Clean remote package path before export")

    tools_cmd = subparsers.add_parser("tools", help="Utility commands for maintenance and packaging")
    tools_sub = tools_cmd.add_subparsers(dest="tools_subcommand")
    tools_build = tools_sub.add_parser("build", help="Compile binaries and generate native packages")
    tools_clean = tools_sub.add_parser("clean", help="Clean host caches and logs")
    tools_clean.add_argument("-v", "--verbose", action="store_true", help="Show verbose cleaning output")

    wardrobe_cmd = subparsers.add_parser("wardrobe", help="Wardrobe commands for templates and costumes")
    wardrobe_sub = wardrobe_cmd.add_subparsers(dest="wardrobe_subcommand")
    wardrobe_sub.add_parser("get", help="Clone or update oa-wardrobe repository")
    wardrobe_sub.add_parser("list", help="List available costumes")
    wardrobe_show = wardrobe_sub.add_parser("show", help="Show costume metadata")
    wardrobe_show.add_argument("name", help="Costume name")
    wardrobe_wear = wardrobe_sub.add_parser("wear", help="Apply a costume to the current system")
    wardrobe_wear.add_argument("name", help="Costume name")
    wardrobe_wear.add_argument("--no-acc", action="store_true", help="Do not apply accessories")
    wardrobe_wear.add_argument("--no-firm", action="store_true", help="Skip firmware-like operations")

    subparsers.add_parser("adapt", help="Adapt the live display resolution for virtual machines")
    subparsers.add_parser("version", help="Show version")
    gen_docs = subparsers.add_parser("_gen_docs", help=argparse.SUPPRESS)
    gen_docs.add_argument("--target", required=True, help="Directory where generated docs are written")

    args = parser.parse_args()

    if args.version:
        cmd.version()
        return

    if args.command == "remaster":
        cmd.remaster(args.mode, args.path, args.stop_after)
    elif args.command == "sysinstall":
        sys.exit(cmd.sysinstall(args.backend))
    elif args.command == "kill":
        cmd.kill()
    elif args.command == "detect":
        cmd.detect()
    elif args.command == "export":
        if args.export_subcommand == "iso":
            sys.exit(cmd.export_iso(args.clean))
        elif args.export_subcommand == "pkg":
            sys.exit(cmd.export_pkg(args.clean))
        else:
            export_cmd.print_help()
            sys.exit(1)
    elif args.command == "tools":
        if args.tools_subcommand == "build":
            sys.exit(cmd.tools_build())
        elif args.tools_subcommand == "clean":
            sys.exit(cmd.tools_clean(args.verbose))
        else:
            tools_cmd.print_help()
            sys.exit(1)
    elif args.command == "wardrobe":
        if args.wardrobe_subcommand == "get":
            sys.exit(cmd.wardrobe_get())
        elif args.wardrobe_subcommand == "list":
            sys.exit(cmd.wardrobe_list())
        elif args.wardrobe_subcommand == "show":
            sys.exit(cmd.wardrobe_show(args.name))
        elif args.wardrobe_subcommand == "wear":
            sys.exit(cmd.wardrobe_wear(args.name, no_acc=args.no_acc, no_firm=args.no_firm))
        else:
            wardrobe_cmd.print_help()
            sys.exit(1)
    elif args.command == "adapt":
        sys.exit(cmd.adapt())
    elif args.command == "version":
        cmd.version()
    elif args.command == "_gen_docs":
        sys.exit(cmd.generate_docs(args.target))
    elif args.command == "kill":
        cmd.kill()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
