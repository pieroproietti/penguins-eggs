import os
import subprocess
import sys

from py_oa_tools import __version__
from py_oa_tools.pkg import bleach, builder, calamares, distro, engine, exporter, pilot, utils, wardrobe


def require_root():
    if os.geteuid() != 0:
        utils.log_error("This command requires root privileges")
        sys.exit(1)


def require_non_root():
    if os.geteuid() == 0:
        utils.log_error("This command must not be run as root")
        sys.exit(1)


def _repo_root():
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _build_version():
    root = _repo_root()
    try:
        version = subprocess.check_output(["git", "describe", "--tags", "--always"], cwd=root, text=True).strip()
    except subprocess.CalledProcessError:
        version = "0.0.0-dev"
    return version


def remaster(mode, path, stop_after):
    require_root()
    utils.log_coala("Starting remaster procedure...")
    my_distro = distro.Distro.from_os_release()
    iso_name = my_distro.get_iso_name()
    final_path = os.path.join(path, iso_name)
    utils.log_coala("ISO will be generated at: %s", final_path)

    profile = pilot.detect_and_load()
    utils.log_success("Brain profile loaded successfully.")

    plan_path = engine.generate_plan(profile.get("remaster", []), my_distro.family_id, True, path, final_path, stop_after)
    utils.log_coala("Using plan: %s", plan_path)

    utils.log_coala("Ensuring bootloaders directory...")
    engine.ensure_bootloaders("/tmp/py_oa_tools/bootloaders")

    utils.log_coala("Generating exclude list (%s mode)...", mode)
    engine.generate_exclude_list(mode)

    utils.log_coala("Starting OA engine...")
    result = subprocess.run([sys.executable, "-m", "py_oa_tools.oa", plan_path])
    if result.returncode != 0:
        utils.log_error("OA execution failed: %s", result.returncode)
        sys.exit(result.returncode)

    if stop_after:
        print("\n[DEBUG] Breakpoint reached, environment is ready for inspection.")
    else:
        utils.log_success("Remaster completed. ISO ready: %s", final_path)


def sysinstall(backend):
    require_root()
    if backend == "calamares":
        utils.log_coala("Preparing Calamares installer environment...")
        work_dir = "/tmp/py_oa_tools/calamares"
        version = _build_version()
        try:
            calamares.setup(work_dir, version)
            return calamares.launch(work_dir)
        except Exception as exc:
            utils.log_error("Calamares setup or launch failed: %s", exc)
            sys.exit(1)
    else:
        utils.log_coala("Launching Krill installer...")
        result = subprocess.run(["krill"])
        return result.returncode


def kill():
    require_root()
    utils.log_coala("Freeing the nest...")
    subprocess.run([sys.executable, "-m", "py_oa_tools.oa", "cleanup"])

    work_path = "/home/eggs"
    utils.log_coala("Removing workspace: %s", work_path)
    subprocess.run(["rm", "-rf", work_path])

    log_file = "/var/log/oa-tools.log"
    utils.log_coala("Removing log file: %s", log_file)
    try:
        os.remove(log_file)
    except FileNotFoundError:
        utils.log_coala("Log file not found, nothing to remove.")
    except OSError as exc:
        utils.log_error("Failed to remove log file: %s", exc)


def version():
    utils.log_coala("py-oa-tools version %s", __version__)


def detect():
    my_distro = distro.Distro.from_os_release()
    print(f"\n{utils.ColorCyan}--- coa distro detect ---{utils.ColorReset}")
    print(f"Host Distro:     {my_distro.distro_id}")
    print(f"Family:          {my_distro.family_id}")
    print(f"DistroLike:      {my_distro.distro_like}")
    print(f"Codename:        {my_distro.codename}")
    print(f"Release:         {my_distro.release_id}")
    return 0


def export_iso(clean: bool = False) -> int:
    return exporter.export_iso(clean)


def export_pkg(clean: bool = False) -> int:
    return exporter.export_pkg(clean)


def tools_build() -> int:
    require_non_root()
    version = _build_version()
    return builder.handle_build(distro.Distro.from_os_release(), version)


def tools_clean(verbose: bool = False) -> int:
    require_root()
    cleaner = bleach.Bleach(verbose)
    return cleaner.clean()


def wardrobe_get() -> int:
    return wardrobe.get()


def wardrobe_list() -> int:
    return wardrobe.list_costumes()


def wardrobe_show(costume_name: str) -> int:
    return wardrobe.show(costume_name)


def wardrobe_wear(costume_name: str, no_acc: bool = False, no_firm: bool = False) -> int:
    return wardrobe.wear(costume_name, no_acc=no_acc, no_firm=no_firm)


def adapt() -> int:
    utils.log_coala("Adapting monitor resolution...")
    outputs = ["Virtual-0", "Virtual-1", "Virtual-2", "Virtual-3"]
    for output in outputs:
        subprocess.run(["xrandr", "--output", output, "--auto"])
    utils.log_success("Resolution adapted.")
    return 0


def generate_docs(target: str) -> int:
    os.makedirs(target, exist_ok=True)
    script = os.path.join(_repo_root(), "coa", "coa")
    if not os.path.isfile(script):
        utils.log_error("Cannot find coa wrapper script for docs generation")
        return 1
    result = subprocess.run([sys.executable, script, "_gen_docs", "--target", target])
    if result.returncode != 0:
        utils.log_error("Docs generation failed")
    return result.returncode
