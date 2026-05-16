import grp
import os
import pwd
import subprocess

ColorBlue = "\033[1;34m"
ColorCyan = "\033[36m"
ColorGreen = "\033[1;32m"
ColorRed = "\033[1;31m"
ColorReset = "\033[0m"
ColorYellow = "\033[33m"


def get_user_groups():
    sudo_user = os.getenv("SUDO_USER")
    default_groups = ["wheel", "audio", "video", "storage", "network"]
    if not sudo_user:
        return default_groups

    try:
        pw = pwd.getpwnam(sudo_user)
        groups = {g.gr_name for g in grp.getgrall() if sudo_user in g.gr_mem or g.gr_gid == pw.pw_gid}
    except KeyError:
        return default_groups

    groups.discard(sudo_user)
    groups.discard("users")
    if not groups:
        groups = set(default_groups)
    groups.add("wheel")
    return sorted(groups)


def log_coala(message: str, *args):
    print(f"{ColorCyan}[coa]{ColorReset} {message % args}")


def log_success(message: str, *args):
    print(f"{ColorGreen}[SUCCESS]{ColorReset} {message % args}")


def log_error(message: str, *args):
    print(f"{ColorRed}[ERRORE]{ColorReset} {message % args}")


def exec_shell(command: str, capture: bool = False):
    if capture:
        result = subprocess.run(["/bin/sh", "-c", command], capture_output=True, text=True)
        return result.stdout, result.returncode
    return subprocess.run(["/bin/sh", "-c", command]).returncode


def ensure_directory(path: str):
    os.makedirs(path, exist_ok=True)
