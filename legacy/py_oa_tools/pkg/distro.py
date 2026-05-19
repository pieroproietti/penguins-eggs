import os
import platform


class Distro:
    def __init__(self, distro_id, codename, release_id, family_id, distro_like, arch):
        self.distro_id = distro_id
        self.codename = codename
        self.release_id = release_id
        self.family_id = family_id
        self.distro_like = distro_like
        self.arch = arch

    @classmethod
    def from_os_release(cls):
        info = {}
        try:
            with open("/etc/os-release", "r", encoding="utf-8") as f:
                for line in f:
                    if "=" in line:
                        key, value = line.split("=", 1)
                        info[key.strip()] = value.strip().strip('"')
        except FileNotFoundError:
            pass

        raw_id = info.get("ID", "unknown").lower()
        raw_like = info.get("ID_LIKE", "").lower()
        likes = raw_like.split()

        family = "generic"
        distro_like = info.get("ID", "unknown")

        for candidate in [raw_id] + likes:
            if candidate in ["debian", "ubuntu", "linuxmint", "kali", "pop"]:
                family = "debian"
                distro_like = "Debian"
                break
            if candidate in ["arch", "endeavouros", "garuda"]:
                family = "archlinux"
                distro_like = "Arch"
                break
            if candidate in ["manjaro", "biglinux", "bigcommunity"]:
                family = "manjaro"
                distro_like = "Manjaro"
                break
            if candidate in ["fedora", "nobara", "rhel", "centos"]:
                family = "fedora"
                distro_like = "Fedora"
                break

        return cls(
            distro_id=info.get("ID", "unknown"),
            codename=info.get("VERSION_CODENAME", ""),
            release_id=info.get("VERSION_ID", ""),
            family_id=family,
            distro_like=distro_like,
            arch=platform.machine(),
        )

    def get_iso_name(self):
        prefix = self.get_iso_prefix()
        return f"{prefix}{self._timestamp()}.iso"

    def get_iso_prefix(self):
        distro_name = self.distro_id.replace(" ", "-").lower()
        code_name = self.codename or self.release_id or "unknown"
        host = os.uname().nodename.replace(" ", "-").lower()
        arch = self.arch or platform.machine()
        return f"egg-of-{distro_name}-{code_name}-{host}-{arch}-"

    @staticmethod
    def _timestamp():
        from datetime import datetime

        return datetime.now().strftime("%Y-%m-%d_%H%M")
