#!/usr/bin/env python3
import json
import os
import subprocess
import sys

from py_oa_tools.pkg import engine as engine_pkg
from py_oa_tools.pkg import utils


def format_task(task, root):
    action = task.get("action")
    return f"[{action}] {task.get('description', '')}"


def run_shell(task, root):
    command = task.get("run_command")
    if not command:
        utils.log_error("oa_shell: run_command missing")
        return 1

    chroot = task.get("chroot", False)
    path_liveroot = task.get("pathLiveFs") or root.get("pathLiveFs")
    if chroot:
        if not path_liveroot:
            utils.log_error("oa_shell: pathLiveFs required for chroot")
            return 1
        target_root = os.path.join(path_liveroot, "liveroot")
        cmd = ["chroot", target_root, "/bin/sh", "-c", command]
    else:
        cmd = ["/bin/sh", "-c", command]

    result = subprocess.run(cmd)
    return result.returncode


def run_mkdir(task, root):
    path = task.get("path")
    if not path:
        utils.log_error("oa_mkdir: path missing")
        return 1
    os.makedirs(path, exist_ok=True)
    return 0


def run_cp(task, root):
    src = task.get("src")
    dst = task.get("dst")
    if not src or not dst:
        utils.log_error("oa_cp: src or dst missing")
        return 1

    if os.path.isdir(src):
        os.makedirs(dst, exist_ok=True)
    else:
        os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)

    result = subprocess.run(["cp", "-a", src, dst])
    return result.returncode


def run_bind(task, root):
    src = task.get("src")
    dst = task.get("dst")
    readonly = task.get("readonly", False)
    if not src or not dst:
        utils.log_error("oa_bind: src or dst missing")
        return 1
    os.makedirs(dst, exist_ok=True)
    if subprocess.run(["mount", "--bind", src, dst]).returncode != 0:
        return 1
    if readonly:
        if subprocess.run(["mount", "-o", "remount,bind,ro", dst]).returncode != 0:
            return 1
    subprocess.run(["mount", "--make-private", dst])
    return 0


def run_mount_generic(task, root):
    type_ = task.get("type")
    src = task.get("src")
    dst = task.get("dst")
    opts = task.get("opts")
    if not type_ or not dst:
        utils.log_error("oa_mount_generic: type or dst missing")
        return 1
    os.makedirs(dst, exist_ok=True)

    if type_ == "bind":
        if not src:
            utils.log_error("oa_mount_generic: bind mount requires src")
            return 1
        if subprocess.run(["mount", "--bind", src, dst]).returncode != 0:
            return 1
        if opts:
            return subprocess.run(["mount", "-o", f"remount,bind,{opts}", dst]).returncode
        return 0

    if type_ == "overlay":
        if not opts:
            utils.log_error("oa_mount_generic: overlay requires opts")
            return 1
        cmd = ["mount", "-t", "overlay", "overlay", dst, "-o", opts]
        return subprocess.run(cmd).returncode

    cmd = ["mount", "-t", type_, src or type_, dst]
    if opts:
        cmd += ["-o", opts]
    return subprocess.run(cmd).returncode


def run_umount(task, root):
    path_live_fs = task.get("pathLiveFs") or root.get("pathLiveFs") or "/home/eggs"
    return engine_pkg.cleanup_workspace(path_live_fs)


def run_users(task, root):
    path_live_fs = task.get("pathLiveFs") or root.get("pathLiveFs")
    if not path_live_fs:
        utils.log_error("oa_users: pathLiveFs missing")
        return 1
    users = task.get("users") or root.get("users")
    if not users:
        utils.log_error("oa_users: users missing")
        return 1
    mode = task.get("mode") or root.get("mode") or "standard"
    return engine_pkg.manage_users(path_live_fs, users, mode)


def execute_task(root, task):
    action = task.get("action")
    if not action:
        utils.log_error("Task missing action")
        return 1

    print(f"[oa] {task.get('description', action)}")
    if action == "oa_shell":
        return run_shell(task, root)
    if action == "oa_mkdir":
        return run_mkdir(task, root)
    if action == "oa_cp":
        return run_cp(task, root)
    if action == "oa_bind":
        return run_bind(task, root)
    if action == "oa_mount_generic":
        return run_mount_generic(task, root)
    if action == "oa_users":
        return run_users(task, root)
    if action == "oa_umount":
        return run_umount(task, root)

    utils.log_error(f"Unknown action: {action}")
    return 1


def main():
    if len(sys.argv) < 2:
        print("Usage: pyoa <plan.json>|cleanup")
        sys.exit(1)

    if sys.argv[1] == "cleanup":
        root_path = "/home/eggs"
        sys.exit(engine_pkg.cleanup_workspace(root_path))

    plan_path = sys.argv[1]
    if not os.path.isfile(plan_path):
        utils.log_error(f"Plan file not found: {plan_path}")
        sys.exit(1)

    with open(plan_path, "r", encoding="utf-8") as f:
        plan = json.load(f)

    root = plan.copy()
    status = 0
    for task in plan.get("plan", []):
        status = execute_task(root, task)
        if status != 0:
            utils.log_error(f"Execution stopped: task failed with status {status}")
            break

    print(f"[oa] Execution completed with status: {status}")
    sys.exit(status)


if __name__ == "__main__":
    main()
