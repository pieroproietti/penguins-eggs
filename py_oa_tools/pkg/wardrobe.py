import os
import subprocess
import yaml

from py_oa_tools.pkg import distro, utils


def get_wardrobe_root() -> str:
    home_dir = None
    sudo_user = os.getenv("SUDO_USER")
    if sudo_user:
        try:
            import pwd

            home_dir = pwd.getpwnam(sudo_user).pw_dir
        except Exception:
            home_dir = None

    if not home_dir:
        home_dir = os.path.expanduser("~")

    return os.path.join(home_dir, ".oa-wardrobe")


def _find_yaml(path: str) -> str | None:
    if not os.path.isdir(path):
        return None
    for entry in os.listdir(path):
        if entry.endswith(".yaml") or entry.endswith(".yml"):
            return os.path.join(path, entry)
    return None


def _load_suit(yaml_path: str) -> dict:
    with open(yaml_path, "r", encoding="utf-8") as fp:
        return yaml.safe_load(fp) or {}


def get() -> int:
    root = get_wardrobe_root()
    if not os.path.isdir(root):
        utils.log_coala("Downloading oa-wardrobe to %s...", root)
        return subprocess.run(["git", "clone", "https://github.com/pieroproietti/oa-wardrobe.git", root]).returncode

    utils.log_coala("oa-wardrobe already exists in %s. Use git pull to update.", root)
    return 0


def list_costumes() -> int:
    root = get_wardrobe_root()
    costumes_dir = os.path.join(root, "costumes")
    if not os.path.isdir(costumes_dir):
        utils.log_error("Wardrobe directory not found: %s", costumes_dir)
        return 1

    print(utils.ColorCyan + "Available costumes:" + utils.ColorReset)
    for name in sorted(os.listdir(costumes_dir)):
        costume_path = os.path.join(costumes_dir, name)
        if not os.path.isdir(costume_path):
            continue
        yaml_path = _find_yaml(costume_path)
        if yaml_path:
            suit = _load_suit(yaml_path)
            desc = suit.get("description", "No description")
            print(f"- {utils.ColorYellow}{name}{utils.ColorReset}: {desc}")
    return 0


def show(costume_name: str) -> int:
    root = get_wardrobe_root()
    costume_path = os.path.join(root, "costumes", costume_name)
    yaml_path = _find_yaml(costume_path)
    if not yaml_path:
        utils.log_error("Costume not found: %s", costume_name)
        return 1

    suit = _load_suit(yaml_path)
    print(utils.ColorCyan + f"Costume: {costume_name}" + utils.ColorReset)
    print(f"Description: {suit.get('description', 'N/A')}")
    print(f"Packages: {suit.get('packages', [])}")
    print(f"Commands: {suit.get('cmds', [])}")
    print(f"Accessories: {suit.get('accessories', [])}")
    return 0


def wear(costume_name: str, no_acc: bool = False, no_firm: bool = False) -> int:
    root = get_wardrobe_root()
    costume_path = os.path.join(root, "costumes", costume_name)
    yaml_path = _find_yaml(costume_path)
    if not yaml_path:
        utils.log_error("Costume not found: %s", costume_name)
        return 1

    suit = _load_suit(yaml_path)
    utils.log_coala("Applying costume: %s", costume_name)
    if _apply_suit(costume_path, suit) != 0:
        utils.log_error("Failed to apply costume %s", costume_name)
        return 1

    if not no_acc and suit.get("accessories"):
        for accessory_name in suit.get("accessories", []):
            accessories_dir = os.path.join(root, "accessories", accessory_name)
            accessory_yaml = _find_yaml(accessories_dir)
            if accessory_yaml:
                accessory = _load_suit(accessory_yaml)
                utils.log_coala("Applying accessory: %s", accessory_name)
                _apply_suit(accessories_dir, accessory)

    _copy_skel_to_user()
    utils.log_success("Costume applied successfully.")
    return 0


def _apply_suit(base_dir: str, suit: dict) -> int:
    if suit.get("packages"):
        utils.log_coala("Installing packages: %s", suit.get("packages"))
        install_packages(suit.get("packages", []))

    sysroot_dir = os.path.join(base_dir, "sysroot")
    if not os.path.isdir(sysroot_dir):
        sysroot_dir = os.path.join(base_dir, "dirs")

    if os.path.isdir(sysroot_dir):
        utils.log_coala("Applying overlay files from %s", sysroot_dir)
        result = subprocess.run(["sudo", "rsync", "-aAXv", f"{sysroot_dir}/", "/"])
        if result.returncode != 0:
            utils.log_error("Overlay sync failed")
            return result.returncode

    for command in suit.get("cmds", []):
        utils.log_coala("Running post-install command: %s", command)
        if utils.exec_shell(command) != 0:
            utils.log_error("Command failed: %s", command)
            return 1

    return 0


def install_packages(packages: list[str]) -> int:
    if not packages:
        return 0

    d = distro.Distro.from_os_release()
    if d.family_id in ["debian"]:
        cmd = "apt-get update && apt-get install -y " + " ".join(packages)
    elif d.family_id in ["archlinux", "manjaro"]:
        cmd = "pacman -Syu --noconfirm " + " ".join(packages)
    elif d.family_id == "fedora":
        cmd = "dnf install -y " + " ".join(packages)
    elif d.family_id == "opensuse":
        cmd = "zypper install -y " + " ".join(packages)
    else:
        cmd = "apt-get update && apt-get install -y " + " ".join(packages)

    return utils.exec_shell(cmd)


def _copy_skel_to_user() -> None:
    user_home = os.path.expanduser("~")
    sudo_user = os.getenv("SUDO_USER")
    if sudo_user and sudo_user != "root":
        user_home = os.path.join("/home", sudo_user)
    utils.log_coala("Synchronizing /etc/skel to %s", user_home)
    utils.exec_shell(f"sudo rsync -a /etc/skel/ {user_home}/")
