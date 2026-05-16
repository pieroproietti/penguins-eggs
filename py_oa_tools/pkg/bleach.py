import glob
import os
import subprocess

from py_oa_tools.pkg import distro, utils


class Bleach:
    def __init__(self, verbose: bool = False):
        self.verbose = verbose

    def log(self, message: str, *args):
        if self.verbose:
            print(f"{utils.ColorYellow}[bleach]{utils.ColorReset} {message % args}")

    def _run(self, args, shell=False):
        if self.verbose:
            print(f"{utils.ColorYellow}[bleach]{utils.ColorReset} {' '.join(args if isinstance(args, list) else [args])}")
        return subprocess.run(args, shell=shell, stdout=subprocess.DEVNULL if not self.verbose else None, stderr=subprocess.DEVNULL if not self.verbose else None)

    def clean(self) -> int:
        d = distro.Distro.from_os_release()
        self.log("Starting cleanup for family: %s", d.family_id)

        if d.family_id == "alpine":
            self._run(["apk", "cache", "clean"])
            self._run(["apk", "cache", "purge"])
        elif d.family_id == "archlinux":
            self._run(["sh", "-c", "yes | pacman -Scc"] , shell=False)
        elif d.family_id == "debian":
            self._run(["apt-get", "clean"])
            self._run(["apt-get", "autoclean", "-y"])
            self._run(["rm", "-f", "/var/lib/apt/lists/lock"])
        elif d.family_id in ["fedora", "openmamba"]:
            self._run(["sh", "-c", "dnf remove $(dnf repoquery --installonly --latest-limit=-1 -q) -y"], shell=False)
            self._run(["dnf", "clean", "all"])
        elif d.family_id == "opensuse":
            self._run(["zypper", "clean", "-a"])
        elif d.family_id == "voidlinux":
            self._run(["xbps-remove", "-O", "-y"])

        self.log("Cleaning Flatpak cache")
        for path in glob.glob("/var/tmp/flatpak-cache-*"):
            try:
                os.remove(path)
            except OSError:
                pass

        self.log("Cleaning bash history")
        try:
            os.remove("/root/.bash_history")
        except OSError:
            pass

        self.log("Cleaning system logs")
        if os.path.exists("/run/systemd/system"):
            self._run(["journalctl", "--rotate"])
            self._run(["journalctl", "--vacuum-time=1s"])
        else:
            self._run(["sh", "-c", "find /var/log -name '*gz' -print0 | xargs -0r rm -f"], shell=False)
            self._run(["sh", "-c", "find /var/log/ -type f -exec truncate -s 0 {} \\;"], shell=False)

        self.log("Dropping kernel pagecache and dentries")
        self._run(["sync"])
        try:
            with open("/proc/sys/vm/drop_caches", "w", encoding="utf-8") as fp:
                fp.write("3")
        except OSError:
            pass

        return 0
