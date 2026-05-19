import glob
import os
import subprocess
import time

from py_oa_tools.pkg import distro, utils

remote_user_host = "root@192.168.1.2"
remote_iso_path = "/var/lib/vz/template/iso/"
remote_pkg_path = "/eggs/"
iso_src_dir = "/home/eggs"


def _ssh_mux_path(suffix: str) -> str:
    return f"/tmp/coa-ssh-mux-{suffix}"


def _run_command(cmd, capture=False):
    utils.log_coala("Running shell command: %s", " ".join(cmd))
    if capture:
        result = subprocess.run(cmd, capture_output=True, text=True)
    else:
        result = subprocess.run(cmd)
    if result.returncode != 0 and capture:
        utils.log_error("Command failed: %s", result.stderr or result.stdout)
    return result


def _start_ssh_mux(socket_path: str):
    _run_command(["ssh", "-M", "-f", "-N", "-o", f"ControlPath={socket_path}", remote_user_host])


def _stop_ssh_mux(socket_path: str):
    _run_command(["ssh", "-O", "exit", "-o", f"ControlPath={socket_path}", remote_user_host])


def _remote_command(socket_path: str, command: str):
    args = ["ssh", "-o", f"ControlPath={socket_path}", remote_user_host, command]
    return _run_command(args)


def export_iso(clean: bool = False) -> int:
    d = distro.Distro.from_os_release()
    prefix_base = d.get_iso_prefix()
    iso_pattern = prefix_base + "*.iso"

    search_path = os.path.join(iso_src_dir, iso_pattern)
    matches = glob.glob(search_path)
    if not matches:
        utils.log_error("No ISO files found for prefix %s in %s", prefix_base, iso_src_dir)
        return 1

    latest_file = max(matches, key=os.path.getmtime)
    target_file_name = os.path.basename(latest_file)
    utils.log_coala("Found latest ISO: %s", target_file_name)

    socket_path = _ssh_mux_path("iso")
    _start_ssh_mux(socket_path)
    try:
        if clean:
            utils.log_coala("Cleaning old ISO files on remote server...")
            rm_command = f"rm -f {remote_iso_path}{prefix_base}*.iso"
            _remote_command(socket_path, rm_command)

        dst = f"{remote_user_host}:{remote_iso_path}"
        utils.log_coala("Uploading %s to %s", target_file_name, remote_iso_path)
        scp_cmd = ["scp", "-o", f"ControlPath={socket_path}", latest_file, dst]
        result = _run_command(scp_cmd)
        if result.returncode != 0:
            utils.log_error("ISO upload failed")
            return result.returncode

        utils.log_success("ISO exported successfully: %s", target_file_name)
        return 0
    finally:
        _stop_ssh_mux(socket_path)


def export_pkg(clean: bool = False) -> int:
    my_distro = distro.Distro.from_os_release()
    family = my_distro.family_id

    utils.log_coala("Detected package family: %s", family)
    pattern = None
    if family == "debian":
        pattern = "oa-tools*.deb"
    elif family == "archlinux":
        pattern = "oa-tools-arch-*.pkg.tar.zst"
    elif family == "fedora":
        pattern = "oa-tools*.rpm"
    elif family == "manjaro":
        pattern = "oa-tools-manjaro-*.pkg.tar.zst"
    else:
        utils.log_coala("No export rule for distro family '%s'", family)
        return 1

    matches = glob.glob(pattern)
    if not matches:
        utils.log_error("No packages found matching %s", pattern)
        return 1

    socket_path = _ssh_mux_path("pkg")
    _start_ssh_mux(socket_path)
    try:
        if clean:
            utils.log_coala("Cleaning old packages on remote server...")
            clean_command = f"rm -f {remote_pkg_path}{pattern}"
            _remote_command(socket_path, clean_command)

        for package_path in matches:
            utils.log_coala("Uploading package: %s", package_path)
            dst = f"{remote_user_host}:{remote_pkg_path}"
            scp_cmd = ["scp", "-o", f"ControlPath={socket_path}", package_path, dst]
            result = _run_command(scp_cmd)
            if result.returncode != 0:
                utils.log_error("Package upload failed: %s", package_path)
                return result.returncode
        utils.log_success("Packages exported successfully.")
        return 0
    finally:
        _stop_ssh_mux(socket_path)
