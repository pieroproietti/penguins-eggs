import os
import shutil
import subprocess

from py_oa_tools.pkg import utils


def setup(output_dir: str, version: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    modules_dir = os.path.join(output_dir, "modules")
    os.makedirs(modules_dir, exist_ok=True)

    prepare_partition_conf(output_dir)
    prepare_user_conf(output_dir)
    prepare_displaymanager_conf(output_dir)
    prepare_removeuser_conf(output_dir)
    prepare_branding_desc(output_dir, version)
    prepare_qml_symlink(output_dir)

    unpack_conf = f"---\nunpack:\n  - source: \"{find_squashfs_path()}\"\n    sourcefs: \"squashfs\"\n    destination: \"\"\n"
    with open(os.path.join(modules_dir, "unpackfs.conf"), "w", encoding="utf-8") as fp:
        fp.write(unpack_conf)


def launch(output_dir: str) -> int:
    utils.log_coala("Launching Calamares from %s", output_dir)
    result = subprocess.run(["calamares", "-d", "-D", "8", "-c", output_dir])
    return result.returncode


def get_partition_table_type() -> str:
    if os.path.isdir("/sys/firmware/efi"):
        return "gpt"
    return "msdos"


def get_available_fs() -> list[str]:
    candidates = ["ext4", "btrfs", "xfs", "f2fs", "jfs", "reiser"]
    available = []
    for fs in candidates:
        if shutil.which(f"mkfs.{fs}"):
            available.append(fs)
    if not available:
        available.append("ext4")
    return available


def prepare_partition_conf(output_dir: str) -> None:
    table_type = get_partition_table_type()
    fs_list = get_available_fs()
    current_date = __import__("datetime").datetime.now().strftime("%Y-%m-%d")
    available_fs_yaml = "[\"" + "\", \"".join(fs_list) + "\"]"

    config = f"---\n# partition.conf generated {current_date}\n# Dialect: oa\n\n"
    config += f"defaultPartitionTableType: {table_type}\n\n"
    config += "partitionLayout:\n    - name: \"root\"\n      filesystem: \"" + fs_list[0] + "\"\n      mountPoint: \"/\"\n      size: 100%\n\n"
    config += "efi:\n  mountPoint: \"/boot/efi\"\n  recommendedSize: 300MiB\n  minimumSize: 32MiB\n  label: \"EFI\"\n\n"
    config += f"defaultFileSystemType:  \"{fs_list[0]}\"\navailableFileSystemTypes: {available_fs_yaml}\n\n"
    config += "userSwapChoices: [none, small, suspend, file]\nluksGeneration: luks1\ndrawNestedPartitions: false\nalwaysShowPartitionLabels: true\ninitialPartitioningChoice: none\ninitialSwapChoice: none\n\nlvm:\n  enable: true\n"

    target = os.path.join(output_dir, "modules", "partition.conf")
    with open(target, "w", encoding="utf-8") as fp:
        fp.write(config)


def prepare_user_conf(output_dir: str) -> None:
    live_user = os.getenv("SUDO_USER") or "live"
    if live_user == "root":
        live_user = "live"

    groups = []
    admin_group = "wheel"
    try:
        result = subprocess.run(["id", "-Gn", live_user], capture_output=True, text=True)
        if result.returncode == 0:
            for g in result.stdout.split():
                if g != live_user:
                    groups.append(g)
                if g == "sudo":
                    admin_group = "sudo"
    except Exception:
        pass

    if not groups:
        for g in ["users", "wheel", "sudo", "audio", "video", "storage", "network", "lp", "scanner"]:
            if shutil.which("grep") and os.path.exists("/etc/group"):
                with open("/etc/group", "r", encoding="utf-8") as fp:
                    content = fp.read()
                if f"\n{g}:" in content or content.startswith(f"{g}:"):
                    groups.append(g)
                    if g == "sudo":
                        admin_group = "sudo"

    yaml_groups = "".join([f"  - {g}\n" for g in groups])
    config = f"---\n# users.conf generated for live installer\n\ndefaultGroups:\n{yaml_groups}\n\nsudoersGroup:    {admin_group}\nsudoersConfigureWithGroup: false\n\nallowWeakPasswords: true\nallowWeakPasswordsDefault: true\n\npasswordRequirements:\n  minLength: -1\n  maxLength: -1\n  libpwquality:\n    - minlen=0\n    - minclass=0\n    - dictcheck=0\n    - usercheck=0\n\nuser:\n  shell: /bin/bash\n  forbidden_names: [ root, nobody ]\n  home_permissions: \"o700\"\n\nhostname:\n  location: EtcFile\n  writeHostsFile: true\n  template: \"oa-${product}\"\n"

    target = os.path.join(output_dir, "modules", "users.conf")
    with open(target, "w", encoding="utf-8") as fp:
        fp.write(config)


def prepare_displaymanager_conf(output_dir: str) -> None:
    display_managers = {
        "lightdm": "/etc/lightdm/lightdm.conf",
        "sddm": "/etc/sddm.conf",
        "gdm3": "/etc/gdm3/daemon.conf",
        "gdm": "/etc/gdm/custom.conf",
        "lxdm": "/etc/lxdm/lxdm.conf",
    }
    active = "none"
    for name, path in display_managers.items():
        if shutil.which(name):
            active = name
            break

    if active == "none":
        return

    config = f"---\n# displaymanager.conf generated for Calamares\ndisplaymanagers:\n  - {active}\n\nexecutable: \"{active}\"\nshowAll: true\n"
    target = os.path.join(output_dir, "modules", "displaymanager.conf")
    with open(target, "w", encoding="utf-8") as fp:
        fp.write(config)


def prepare_removeuser_conf(output_dir: str) -> None:
    config = "---\n# removeuser.conf generated for Calamares\nusername: live\n"
    target = os.path.join(output_dir, "modules", "removeuser.conf")
    with open(target, "w", encoding="utf-8") as fp:
        fp.write(config)


def prepare_branding_desc(output_dir: str, oa_version: str) -> None:
    info = {}
    if os.path.exists("/etc/os-release"):
        with open("/etc/os-release", "r", encoding="utf-8") as fp:
            for line in fp:
                if "=" in line:
                    key, val = line.strip().split("=", 1)
                    info[key] = val.strip().strip('"')

    name = info.get("NAME", "Linux")
    pretty_name = info.get("PRETTY_NAME", name)
    home_url = info.get("HOME_URL", "https://penguins-eggs.net/")
    support_url = info.get("SUPPORT_URL", "https://github.com/pieroproietti/oa-tools/issues/")
    bug_report_url = info.get("BUG_REPORT_URL", "https://github.com/pieroproietti/oa-tools/issues/")
    release_notes_url = home_url
    version_text = f"oa-tools {oa_version}"

    content = f"---\ncomponentName: eggs\n\nimages:\n  productIcon:    \"eggs.png\"\n  productLogo:    \"eggs.png\"\n  productWelcome: \"welcome.png\"\n\nslideshow:       \"show.qml\"\nslideshowAPI:    1\n\nstrings:\n  productName:         \"{pretty_name}\"\n  shortProductName:    \"{pretty_name.lower()}\"\n  version:             \"{version_text}\"\n  shortVersion:        \"{version_text}\"\n  versionedName:       \"{pretty_name.lower()} {version_text}\"\n  shortVersionedName:  \"{pretty_name} {version_text}\"\n  bootloaderEntryName: \"{name}\"\n  productUrl:          \"{home_url}\"\n  supportUrl:          \"{support_url}\"\n  knownIssuesUrl:      \"{bug_report_url}\"\n  releaseNotesUrl:     \"{release_notes_url}\"\n\nstyle:\n  SidebarBackground:        \"#292F34\"\n  sidebarBackground:        \"#292F34\"\n  SidebarBackgroundCurrent: \"#D35400\"\n  sidebarBackgroundCurrent: \"#D35400\"\n  SidebarText:              \"#FFFFFF\"\n  sidebarText:              \"#FFFFFF\"\n  SidebarTextCurrent:       \"#292F34\"\n  sidebarTextCurrent:       \"#292F34\"\n\nwelcomeStyleCalamares: true\n"

    branding_dir = os.path.join(output_dir, "branding", "eggs")
    os.makedirs(branding_dir, exist_ok=True)
    with open(os.path.join(branding_dir, "branding.desc"), "w", encoding="utf-8") as fp:
        fp.write(content)


def prepare_qml_symlink(output_dir: str) -> None:
    source = "/usr/share/calamares/qml"
    target = os.path.join(output_dir, "qml")
    if os.path.exists(target):
        return
    if not os.path.exists(source):
        raise FileNotFoundError(f"Calamares qml source not found: {source}")
    os.symlink(source, target)


def find_squashfs_path() -> str:
    candidates = [
        "/run/miso/bootmnt/manjaro/x86_64/livefs.sfs",
        "/run/miso/bootmnt/manjaro/x86_64/rootfs.sfs",
        "/run/live/medium/live/filesystem.squashfs",
        "/lib/live/mount/medium/live/filesystem.squashfs",
        "/run/archiso/bootmnt/arch/x86_64/airootfs.sfs",
        "/run/initramfs/live/LiveOS/squashfs.img",
        "/live/filesystem.squashfs",
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return "/ERRORE_SQUASHFS_NON_TROVATO/filesystem.squashfs"
