import json
import os
import shutil
import subprocess
import tempfile

from py_oa_tools.pkg import utils


def _replace_iso_path(text, iso_path):
    if not text:
        return text
    return text.replace("${ISO_OUTPUT}", iso_path)


def _replace_path(text, work_path):
    if not text:
        return text
    return text.replace("/home/eggs", work_path)


def _replace_paths(obj, work_path):
    if isinstance(obj, str):
        return obj.replace("/home/eggs", work_path)
    if isinstance(obj, dict):
        return {key: _replace_paths(value, work_path) for key, value in obj.items()}
    if isinstance(obj, list):
        return [_replace_paths(item, work_path) for item in obj]
    return obj


def _replace_description(text, final_iso_path):
    if not text:
        return text
    return text.replace("${ISO_NAME}", os.path.basename(final_iso_path))


def expand_mount_logic(work_path):
    tasks = []
    liveroot = os.path.join(work_path, "liveroot")
    overlay = os.path.join(work_path, ".overlay")

    tasks.append({"action": "oa_mkdir", "path": work_path, "description": "Create workspace"})
    tasks.append({"action": "oa_mkdir", "path": liveroot, "description": "Create liveroot"})
    tasks.append({"action": "oa_mkdir", "path": overlay, "description": "Create overlay root"})
    tasks.append({"action": "oa_mkdir", "path": os.path.join(overlay, "lowerdir"), "description": "Create overlay lowerdir"})
    tasks.append({"action": "oa_mkdir", "path": os.path.join(overlay, "upperdir"), "description": "Create overlay upperdir"})
    tasks.append({"action": "oa_mkdir", "path": os.path.join(overlay, "workdir"), "description": "Create overlay workdir"})

    tasks.append({"action": "oa_cp", "src": "/etc", "dst": liveroot, "description": "Copy /etc into liveroot"})
    tasks.append({"action": "oa_cp", "src": "/boot", "dst": liveroot, "description": "Copy /boot into liveroot"})

    for entry in ["vmlinuz", "initrd.img", "vmlinuz.old", "initrd.img.old"]:
        src = os.path.join("/", entry)
        if os.path.lexists(src):
            tasks.append({
                "action": "oa_cp",
                "src": src,
                "dst": os.path.join(liveroot, entry),
                "description": f"Copy symlink: {entry}",
            })

    root_entries = ["bin", "sbin", "lib", "lib64", "opt", "root", "srv"]
    for entry in root_entries:
        src = os.path.join("/", entry)
        dst = os.path.join(liveroot, entry)
        if os.path.lexists(src):
            if os.path.islink(src):
                target = os.readlink(src)
                tasks.append({
                    "action": "oa_shell",
                    "description": f"Replicate usrmerge symlink: {entry}",
                    "run_command": f"ln -sf {target} {dst}",
                })
            else:
                tasks.append({
                    "action": "oa_bind",
                    "src": src,
                    "dst": dst,
                    "readonly": True,
                    "description": f"Bind mount {src} into liveroot",
                })

    for topdir in ["usr", "var"]:
        lower = os.path.join(overlay, "lowerdir", topdir)
        upper = os.path.join(overlay, "upperdir", topdir)
        work = os.path.join(overlay, "workdir", topdir)
        merged = os.path.join(liveroot, topdir)

        tasks.append({"action": "oa_mkdir", "path": lower, "description": f"Create lowerdir for {topdir}"})
        tasks.append({"action": "oa_mkdir", "path": upper, "description": f"Create upperdir for {topdir}"})
        tasks.append({"action": "oa_mkdir", "path": work, "description": f"Create workdir for {topdir}"})
        tasks.append({"action": "oa_mkdir", "path": merged, "description": f"Create merged mount point for {topdir}"})

        tasks.append({
            "action": "oa_bind",
            "src": os.path.join("/", topdir),
            "dst": lower,
            "readonly": True,
            "description": f"Bind mount /{topdir} into overlay lowerdir",
        })
        tasks.append({
            "action": "oa_mount_generic",
            "type": "overlay",
            "src": "overlay",
            "dst": merged,
            "opts": f"lowerdir={lower},upperdir={upper},workdir={work}",
            "description": f"Mount overlay for /{topdir}",
        })

    tasks.append({
        "action": "oa_mount_generic",
        "type": "proc",
        "src": "proc",
        "dst": os.path.join(liveroot, "proc"),
        "description": "Mount proc into liveroot",
    })
    tasks.append({
        "action": "oa_mount_generic",
        "type": "sysfs",
        "src": "sys",
        "dst": os.path.join(liveroot, "sys"),
        "description": "Mount sysfs into liveroot",
    })
    tasks.append({
        "action": "oa_bind",
        "src": "/dev",
        "dst": os.path.join(liveroot, "dev"),
        "description": "Bind mount /dev into liveroot",
    })
    tasks.append({
        "action": "oa_bind",
        "src": "/run",
        "dst": os.path.join(liveroot, "run"),
        "description": "Bind mount /run into liveroot",
    })

    tasks.append({
        "action": "oa_mount_generic",
        "type": "tmpfs",
        "src": "tmpfs",
        "dst": os.path.join(liveroot, "tmp"),
        "opts": "mode=1777",
        "description": "Mount tmpfs for /tmp",
    })

    for task in tasks:
        task.setdefault("pathLiveFs", work_path)

    return tasks


def generate_plan(steps, family_id, is_remaster, work_path, final_iso_path, stop_after=""):
    plan = {"pathLiveFs": work_path, "plan": []}
    hit_breakpoint = False

    for step in steps:
        if hit_breakpoint and step.get("name") != "coa-cleanup":
            continue

        step = _replace_paths(step, work_path)
        step_description = _replace_description(step.get("description", ""), final_iso_path)
        run_command = _replace_iso_path(step.get("run_command", ""), final_iso_path)
        run_command = _replace_path(run_command, work_path)
        action = step.get("action")

        if action == "oa_mount_logic":
            plan["plan"].extend(expand_mount_logic(work_path))
        elif action == "oa_users":
            plan["plan"].append({
                "action": "oa_shell",
                "description": "Create live user home and copy skel",
                "run_command": f"mkdir -p {os.path.join(work_path, 'liveroot', 'home', 'live')} && cp -a {os.path.join(work_path, 'liveroot', 'etc', 'skel', '.')} {os.path.join(work_path, 'liveroot', 'home', 'live')}/",
                "chroot": False,
                "pathLiveFs": work_path,
            })
            users = step.get("users") or []
            if not users:
                users = [{
                    "login": "live",
                    "password": "$6$oa-tools$uTKAYeAVn.Y.Dy2To6HXsHt1Gt4HpMghmOV93a46jFY7hkAQ3tk7eRTKjcvSYDf5sOf3qnKzyyPYXurKp9ST3.",
                    "home": "/home/live",
                    "shell": "/bin/bash",
                    "uid": 1000,
                    "gid": 1000,
                }]

            mirrored_groups = utils.get_user_groups()
            for user in users:
                user["groups"] = mirrored_groups

            plan["plan"].append({
                "action": "oa_users",
                "description": "Inject live user identities",
                "users": users,
                "pathLiveFs": work_path,
            })
        elif action == "oa_umount":
            plan["plan"].append({
                "action": "oa_umount",
                "description": step_description or "Unmount and cleanup",
                "pathLiveFs": work_path,
            })
        else:
            task = dict(step)
            task["description"] = step_description
            task["run_command"] = run_command
            task["pathLiveFs"] = work_path
            plan["plan"].append(task)

        if stop_after and step.get("name") == stop_after:
            utils.log_coala("Breakpoint '%s' reached. Plan truncated.", stop_after)
            hit_breakpoint = True

    return save_plan(plan)


def save_plan(plan):
    directory = tempfile.mkdtemp(prefix="py_oa_tools_plan_")
    plan_path = os.path.join(directory, "oa-plan.json")
    with open(plan_path, "w", encoding="utf-8") as fp:
        json.dump(plan, fp, indent=2)
    return plan_path


def generate_exclude_list(mode):
    exclude_file = "/tmp/py_oa_tools/excludes.list"
    excludes = [
        "dev/*",
        "proc/*",
        "sys/*",
        "run/*",
        "tmp/*",
        "var/tmp/*",
        "var/tmp/.??*",
        "lost+found",
        "home/eggs/.overlay/*",
        "home/eggs/.overlay/.??*",
        "home/eggs/isodir/*",
        "home/eggs/*.iso",
        "boot/efi/EFI",
        "boot/loader/entries/",
        "etc/fstab",
        "etc/mtab",
        "swapfile",
        "var/lib/docker/",
        "var/lib/containers/",
        "etc/udev/rules.d/70-persistent-cd.rules",
        "etc/udev/rules.d/70-persistent-net.rules",
        "etc/NetworkManager/system-connections/*",
        "etc/ssh/ssh_host_*",
        "var/lib/NetworkManager/secret_key",
        "var/cache/apt/archives/*",
        "var/cache/apt/*.bin",
        "var/cache/pacman/pkg/*",
        "var/cache/dnf/*",
        "etc/rc*.d/*cryptdisks*",
    ]
    if mode not in ["clone", "crypted"]:
        excludes.extend(["root/*", "root/.??*"])
    else:
        excludes.extend([
            "root/.bash_history",
            "root/.zsh_history",
            "home/*/.bash_history",
            "home/*/.local/share/Trash/*",
            "home/*/.cache/*",
        ])

    is_github_action = os.getenv("GITHUB_ACTIONS") == "true"
    if not is_github_action and os.path.exists("/home/runner/work"):
        is_github_action = True

    if is_github_action:
        excludes.extend([
            "opt/hostedtoolcache/*",
            "home/runner/work/*",
            "usr/local/lib/android/*",
            "usr/share/dotnet/*",
            "usr/lib/jvm/*",
            "usr/local/share/powershell/*",
            "usr/share/swift/*",
            "var/lib/gems/*",
        ])

    user_list = "/etc/oa-tools.d/exclusion.list"
    if not os.path.isfile(user_list):
        user_list = os.path.join("conf", "exclusion.list")

    if os.path.isfile(user_list):
        with open(user_list, "r", encoding="utf-8") as fp:
            for line in fp:
                line = line.strip()
                if line and not line.startswith("#"):
                    excludes.append(line.lstrip("/"))

    os.makedirs(os.path.dirname(exclude_file), exist_ok=True)
    with open(exclude_file, "w", encoding="utf-8") as fp:
        fp.write("\n".join(excludes) + "\n")
    return exclude_file


def ensure_bootloaders(dest):
    os.makedirs(dest, exist_ok=True)
    return dest


def cleanup_workspace(path_live_fs):
    mounts = []
    if not os.path.isdir(path_live_fs):
        return 0

    with open("/proc/mounts", "r", encoding="utf-8") as fp:
        for line in fp:
            parts = line.split()
            if len(parts) >= 2:
                mount_point = parts[1]
                if mount_point.startswith(path_live_fs):
                    mounts.append(mount_point)

    # Unmount deepest paths first to avoid dependency failures
    mounts.sort(key=len, reverse=True)

    errors = 0
    for mount_point in mounts:
        if subprocess.run(["umount", "-l", mount_point]).returncode != 0:
            errors += 1

    return 0 if errors == 0 else 1


def manage_users(path_live_fs, users, users_mode="standard"):
    liveroot = os.path.join(path_live_fs, "liveroot")
    passwd_path = os.path.join(liveroot, "etc", "passwd")
    shadow_path = os.path.join(liveroot, "etc", "shadow")
    group_path = os.path.join(liveroot, "etc", "group")

    def sanitize(file_path):
        if not os.path.isfile(file_path):
            return
        lines = []
        with open(file_path, "r", encoding="utf-8") as fp:
            for line in fp:
                parts = line.split(":")
                if len(parts) < 3:
                    continue
                try:
                    uid = int(parts[2])
                except ValueError:
                    uid = 0
                if uid >= 1000 and parts[0] != "root":
                    continue
                lines.append(line.rstrip("\n"))
        with open(file_path, "w", encoding="utf-8") as fp:
            fp.write("\n".join(lines) + "\n")

    if users_mode not in ["clone", "crypted"]:
        sanitize(passwd_path)
        sanitize(shadow_path)
        sanitize(group_path)

    if not os.path.isdir(os.path.join(liveroot, "home")):
        os.makedirs(os.path.join(liveroot, "home"), exist_ok=True)

    import crypt

    for user in users:
        login = user.get("login")
        password = user.get("password", "")
        home = user.get("home", "/home/live")
        shell = user.get("shell", "/bin/bash")
        uid = user.get("uid", 1000)
        gid = user.get("gid", 1000)
        groups = user.get("groups", [])

        if not login:
            continue

        if not password.startswith("$"):
            password = crypt.crypt(password, "$6$oa$")

        with open(passwd_path, "a", encoding="utf-8") as fp:
            fp.write(f"{login}:x:{uid}:{gid}:live user:{home}:{shell}\n")
        with open(shadow_path, "a", encoding="utf-8") as fp:
            fp.write(f"{login}:{password}:18455:0:99999:7:::\n")
        with open(group_path, "a", encoding="utf-8") as fp:
            fp.write(f"{login}:x:{gid}:\n")

        if groups:
            with open(group_path, "a", encoding="utf-8") as fp:
                for group in groups:
                    fp.write(f"{group}:x:1000:{login}\n")

        home_dir = os.path.join(liveroot, home.lstrip("/"))
        os.makedirs(home_dir, exist_ok=True)
        skel_dir = os.path.join(liveroot, "etc", "skel")
        if os.path.isdir(skel_dir):
            for root_dir, dirs, files in os.walk(skel_dir, followlinks=False):
                rel_dir = os.path.relpath(root_dir, skel_dir)
                dest_dir = home_dir if rel_dir == "." else os.path.join(home_dir, rel_dir)
                os.makedirs(dest_dir, exist_ok=True)
                for d in dirs:
                    try:
                        os.makedirs(os.path.join(dest_dir, d), exist_ok=True)
                    except OSError:
                        pass
                for f in files:
                    src_file = os.path.join(root_dir, f)
                    dst_file = os.path.join(dest_dir, f)
                    try:
                        if os.path.islink(src_file):
                            if os.path.lexists(dst_file):
                                os.remove(dst_file)
                            target = os.readlink(src_file)
                            os.symlink(target, dst_file)
                        else:
                            shutil.copy2(src_file, dst_file, follow_symlinks=False)
                    except OSError:
                        continue
        subprocess.run(["chown", "-R", f"{uid}:{gid}", home_dir])

    return 0
