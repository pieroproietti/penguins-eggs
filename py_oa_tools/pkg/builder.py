import glob
import os
import shutil
import subprocess
import sys

from py_oa_tools.pkg import distro, utils

AppVersion = ""


def _project_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _run(cmd, cwd=None, check=False):
    utils.log_coala("Running: %s", " ".join(cmd))
    return subprocess.run(cmd, cwd=cwd, check=check)


def _git_version() -> str:
    root = _project_root()
    try:
        return subprocess.check_output(["git", "describe", "--tags", "--always"], cwd=root, text=True).strip()
    except subprocess.CalledProcessError:
        return "0.0.0-dev"


def parse_git_version(version: str) -> tuple[str, str]:
    clean = version.lstrip("v")
    parts = clean.split("-")
    base_ver = parts[0]
    rel_num = parts[1] if len(parts) > 1 else "1"
    return base_ver, rel_num


def handle_build(my_distro: distro.Distro, version: str) -> int:
    global AppVersion
    AppVersion = version
    base_ver, rel_num = parse_git_version(version)
    proj_root = _project_root()
    oa_dir = os.path.join(proj_root, "oa")
    coa_dir = os.path.join(proj_root, "coa")

    print(f"{utils.ColorCyan}===================================================={utils.ColorReset}")
    print(f"{utils.ColorCyan}         COA BUILDER - Native Package Generation      {utils.ColorReset}")
    print(f"{utils.ColorCyan}===================================================={utils.ColorReset}")

    utils.log_coala("Building version: %s", version)

    utils.log_coala("Compiling Engine (oa)...")
    result = _run(["make", "-C", oa_dir, f"VERSION={version}", "clean", "all"], cwd=proj_root)
    if result.returncode != 0:
        utils.log_error("Engine compilation failed")
        return result.returncode

    utils.log_coala("Compiling Orchestrator (coa)...")
    output_path = os.path.join(coa_dir, "coa")
    go_result = _run(["go", "build", "-ldflags", f"-X 'coa/pkg/cmd.AppVersion={version}'", "-o", output_path, "main.go"], cwd=coa_dir)
    if go_result.returncode != 0:
        utils.log_error("Orchestrator compilation failed")
        return go_result.returncode

    utils.log_coala("Generating documentation and completion stubs...")
    generate_docs(coa_dir)
    ensure_documentation(coa_dir)

    family = my_distro.family_id
    utils.log_coala("Detected distro family: %s", family)
    if family == "archlinux":
        build_arch_package(proj_root, base_ver, rel_num)
    elif family == "manjaro":
        build_manjaro_package(proj_root, base_ver, rel_num)
    elif family in ["fedora", "rhel", "centos", "rocky", "almalinux"]:
        build_fedora_package(proj_root, oa_dir, coa_dir, base_ver, rel_num)
    else:
        build_debian_package(proj_root, oa_dir, coa_dir, f"{base_ver}-{rel_num}")

    return 0


def generate_docs(coa_dir: str) -> None:
    target = os.path.join(coa_dir, "docs")
    os.makedirs(target, exist_ok=True)
    doc_path = os.path.join(target, "coa.md")
    script = os.path.join(coa_dir, "coa")
    if not os.path.isfile(script):
        return
    try:
        result = subprocess.run([sys.executable, script, "_gen_docs", "--target", target], cwd=coa_dir)
        if result.returncode != 0:
            utils.log_error("Doc generation command failed")
    except Exception:
        utils.log_error("Unable to generate docs")


def ensure_documentation(coa_dir: str) -> None:
    docs_dir = os.path.join(coa_dir, "docs")
    man_dir = os.path.join(docs_dir, "man")
    completion_dir = os.path.join(docs_dir, "completion")
    os.makedirs(man_dir, exist_ok=True)
    os.makedirs(completion_dir, exist_ok=True)

    man_path = os.path.join(man_dir, "coa.1")
    if not os.path.exists(man_path):
        with open(man_path, "w", encoding="utf-8") as fp:
            fp.write(".TH coa 1 \"coa Python wrapper\"\n.SH NAME\ncoa \- Python replacement for oa-tools coordinator\n.SH SYNOPSIS\ncoa [command] [options]\n")

    bash_path = os.path.join(completion_dir, "coa.bash")
    if not os.path.exists(bash_path):
        with open(bash_path, "w", encoding="utf-8") as fp:
            fp.write("# bash completion placeholder for coa\n")

    zsh_path = os.path.join(completion_dir, "coa.zsh")
    if not os.path.exists(zsh_path):
        with open(zsh_path, "w", encoding="utf-8") as fp:
            fp.write("# zsh completion placeholder for coa\n")

    fish_path = os.path.join(completion_dir, "coa.fish")
    if not os.path.exists(fish_path):
        with open(fish_path, "w", encoding="utf-8") as fp:
            fp.write("# fish completion placeholder for coa\n")


def build_arch_package(proj_root: str, base_ver: str, rel_num: str) -> None:
    pkgbuild = f"PKGBUILD"
    content = """# Maintainer: Piero Proietti <piero.proietti@gmail.com>
# coa is the mind and oa the arm
pkgname=oa-tools-arch
pkgver={{BASE_VER}}
pkgrel={{REL_NUM}}
pkgdesc="oa-tools universal Linux remastering"
arch=('x86_64')
license=('GPL3')
depends=( 'mkinitcpio-archiso' 'efibootmgr' 'libisoburn' 'squashfs-tools' 'mtools' 'dosfstools' 'arch-install-scripts' 'grub' 'rsync' 'sudo' 'pv' 'git' )
conflicts=('penguins-eggs' 'oa-tools')
backup=('etc/oa-tools.d/oa-tools.yaml')
options=(!debug)

build() {
    cd "${startdir}/oa"
    make clean && make
    cd "${startdir}/coa"
    go build -ldflags "-X 'coa/pkg/cmd.AppVersion=${pkgver}'" -o coa main.go
}

package() {
    install -Dm755 "${startdir}/oa/oa" "${pkgdir}/usr/bin/oa"
    install -Dm755 "${startdir}/coa/coa" "${pkgdir}/usr/bin/coa"
    ln -s coa "${pkgdir}/usr/bin/eggs"
    install -d "${pkgdir}/etc/oa-tools.d/brain.d"
    if [ -d "${startdir}/coa/brain.d" ]; then
        cp -r "${startdir}/coa/brain.d/"* "${pkgdir}/etc/oa-tools.d/brain.d/"
    fi
    cat <<EOF > "${pkgdir}/etc/oa-tools.d/oa-tools.yaml"
---
system:
  dialect: "oa"
  version: "${pkgver}"

wardrobe:
  root: "~/.oa-wardrobe"
  repo: "https://github.com/pieroproietti/oa-wardrobe.git"

remaster:
  default_user: "artisan"
  work_dir: "/home/eggs"
EOF
    if [ -d "${startdir}/conf" ]; then
        cp -r "${startdir}/conf/"* "${pkgdir}/etc/oa-tools.d/"
    fi
    mkdir -p "${pkgdir}/usr/share/man/man1"
    mkdir -p "${pkgdir}/usr/share/bash-completion/completions"
    mkdir -p "${pkgdir}/usr/share/zsh/vendor-completions"
    mkdir -p "${pkgdir}/usr/share/fish/vendor_completions.d"
    if [ -d "${startdir}/coa/docs/man" ]; then
        cp "${startdir}/coa/docs/man/"*.1 "${pkgdir}/usr/share/man/man1/"
    fi
    if [ -f "${startdir}/coa/docs/completion/coa.bash" ]; then
        install -Dm644 "${startdir}/coa/docs/completion/coa.bash" "${pkgdir}/usr/share/bash-completion/completions/coa"
    fi
    if [ -f "${startdir}/coa/docs/completion/coa.zsh" ]; then
        install -Dm644 "${startdir}/coa/docs/completion/coa.zsh" "${pkgdir}/usr/share/zsh/vendor-completions/_coa"
    fi
    if [ -f "${startdir}/coa/docs/completion/coa.fish" ]; then
        install -Dm644 "${startdir}/coa/docs/completion/coa.fish" "${pkgdir}/usr/share/fish/vendor_completions.d/coa.fish"
    fi
    ln -s coa "${pkgdir}/usr/share/bash-completion/completions/eggs"
    ln -s _coa "${pkgdir}/usr/share/zsh/vendor-completions/_eggs"
    ln -s coa.fish "${pkgdir}/usr/share/fish/vendor_completions.d/eggs.fish"
    echo "complete -o default -F __start_coa eggs" >> "${pkgdir}/usr/share/bash-completion/completions/coa"
}
"""
    content = content.replace("{{BASE_VER}}", base_ver).replace("{{REL_NUM}}", rel_num)
    with open(os.path.join(proj_root, pkgbuild), "w", encoding="utf-8") as fp:
        fp.write(content)
    print(f"{utils.ColorGreen}[SUCCESS]{utils.ColorReset} PKGBUILD (Arch) created for {base_ver}-{rel_num}")


def build_manjaro_package(proj_root: str, base_ver: str, rel_num: str) -> None:
    pkgbuild = "PKGBUILD"
    content = """# Maintainer: Piero Proietti <piero.proietti@gmail.com>
# coa is the mind and oa the arm
pkgname=oa-tools-manjaro
pkgver={{BASE_VER}}
pkgrel={{REL_NUM}}
pkgdesc="oa-tools universal Linux remastering (Manjaro edition)"
arch=('x86_64')
license=('GPL3')
depends=( 'manjaro-tools-iso' 'efibootmgr' 'libisoburn' 'squashfs-tools' 'mtools' 'dosfstools' 'arch-install-scripts' 'grub' 'rsync' 'sudo' 'pv' 'git' )
conflicts=('penguins-eggs')
backup=('etc/oa-tools.d/oa-tools.yaml')
options=(!debug)

build() {
    cd "${startdir}/oa"
    make clean && make
    cd "${startdir}/coa"
    go build -ldflags "-X 'coa/pkg/cmd.AppVersion=${pkgver}'" -o coa main.go
}

package() {
    install -Dm755 "${startdir}/oa/oa" "${pkgdir}/usr/bin/oa"
    install -Dm755 "${startdir}/coa/coa" "${pkgdir}/usr/bin/coa"
    ln -s coa "${pkgdir}/usr/bin/eggs"
    install -d "${pkgdir}/etc/oa-tools.d/brain.d"
    cp -r "${startdir}/coa/brain.d/"* "${pkgdir}/etc/oa-tools.d/brain.d/"
    cat <<EOF > "${pkgdir}/etc/oa-tools.d/oa-tools.yaml"
---
system:
  dialect: "oa"
  version: "${pkgver}"

wardrobe:
  root: "~/.oa-wardrobe"
  repo: "https://github.com/pieroproietti/oa-wardrobe.git"

remaster:
  default_user: "artisan"
  work_dir: "/home/eggs"
EOF
    if [ -d "${startdir}/conf" ]; then
        cp -r "${startdir}/conf/"* "${pkgdir}/etc/oa-tools.d/"
    fi
    install -Dm644 "${startdir}/coa/docs/man/"*.1 -t "${pkgdir}/usr/share/man/man1/"
    install -Dm644 "${startdir}/coa/docs/completion/coa.bash" "${pkgdir}/usr/share/bash-completion/completions/coa"
    install -Dm644 "${startdir}/coa/docs/completion/coa.zsh" "${pkgdir}/usr/share/zsh/vendor-completions/_coa"
    install -Dm644 "${startdir}/coa/docs/completion/coa.fish" "${pkgdir}/usr/share/fish/vendor_completions.d/coa.fish"
    ln -s coa "${pkgdir}/usr/share/bash-completion/completions/eggs"
    ln -s _coa "${pkgdir}/usr/share/zsh/vendor-completions/_eggs"
    ln -s coa.fish "${pkgdir}/usr/share/fish/vendor_completions.d/eggs.fish"
    echo "complete -o default -F __start_coa eggs" >> "${pkgdir}/usr/share/bash-completion/completions/coa"
}
"""
    content = content.replace("{{BASE_VER}}", base_ver).replace("{{REL_NUM}}", rel_num)
    with open(os.path.join(proj_root, pkgbuild), "w", encoding="utf-8") as fp:
        fp.write(content)
    print(f"{utils.ColorGreen}[SUCCESS]{utils.ColorReset} PKGBUILD (Manjaro) created for {base_ver}-{rel_num}")


def build_debian_package(proj_root: str, oa_dir: str, coa_dir: str, pkg_version: str) -> None:
    pkg_name = f"oa-tools_{pkg_version}_amd64"
    build_dir = os.path.join("/tmp", pkg_name)
    shutil.rmtree(build_dir, ignore_errors=True)
    dirs = [
        os.path.join(build_dir, "DEBIAN"),
        os.path.join(build_dir, "usr/bin"),
        os.path.join(build_dir, "etc/oa-tools.d/brain.d"),
        os.path.join(build_dir, "usr/share/man/man1"),
        os.path.join(build_dir, "usr/share/bash-completion/completions"),
        os.path.join(build_dir, "usr/share/zsh/vendor-completions"),
        os.path.join(build_dir, "usr/share/fish/vendor_completions.d"),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    shutil.copy2(os.path.join(oa_dir, "oa"), os.path.join(build_dir, "usr/bin", "oa"))
    shutil.copy2(os.path.join(coa_dir, "coa"), os.path.join(build_dir, "usr/bin", "coa"))
    os.chmod(os.path.join(build_dir, "usr/bin", "oa"), 0o755)
    os.chmod(os.path.join(build_dir, "usr/bin", "coa"), 0o755)
    try:
        os.symlink("coa", os.path.join(build_dir, "usr/bin", "eggs"))
    except FileExistsError:
        pass

    conf_dest = os.path.join(build_dir, "etc", "oa-tools.d")
    os.makedirs(conf_dest, exist_ok=True)
    with open(os.path.join(conf_dest, "oa-tools.yaml"), "w", encoding="utf-8") as fp:
        fp.write(f"---\nsystem:\n  dialect: \"oa\"\n  version: \"{pkg_version}\"\n\nwardrobe:\n  root: \"~/.oa-wardrobe\"\n  repo: \"https://github.com/pieroproietti/oa-wardrobe.git\"\n\nremaster:\n  default_user: \"artisan\"\n  work_dir: \"/home/eggs\"\n")

    brain_src = os.path.join(proj_root, "coa", "brain.d")
    brain_dest = os.path.join(conf_dest, "brain.d")
    if os.path.isdir(brain_src):
        shutil.copytree(brain_src, brain_dest, dirs_exist_ok=True)

    docs_man = os.path.join(coa_dir, "docs", "man")
    if os.path.isdir(docs_man):
        for item in os.listdir(docs_man):
            if item.endswith(".1"):
                shutil.copy2(os.path.join(docs_man, item), os.path.join(build_dir, "usr/share/man/man1", item))

    completion_dir = os.path.join(coa_dir, "docs", "completion")
    if os.path.isdir(completion_dir):
        for name in ["coa.bash", "coa.zsh", "coa.fish"]:
            src = os.path.join(completion_dir, name)
            if os.path.isfile(src):
                dest = os.path.join(build_dir, "usr/share/bash-completion/completions" if name.endswith(".bash") else "usr/share/zsh/vendor-completions" if name.endswith(".zsh") else "usr/share/fish/vendor_completions.d", name if name != "coa.zsh" else "_coa")
                shutil.copy2(src, dest)
    bash_target = os.path.join(build_dir, "usr/share/bash-completion/completions", "coa")
    with open(bash_target, "a", encoding="utf-8") as fp:
        fp.write("\n# eggs alias completion support\ncomplete -o default -F __start_coa eggs\n")
    try:
        _run(["dpkg-deb", "--build", build_dir], cwd="/tmp", check=True)
        final = os.path.join(proj_root, f"{pkg_name}.deb")
        shutil.move(os.path.join("/tmp", f"{pkg_name}.deb"), final)
        utils.log_success("Package created: %s", final)
    except Exception as exc:
        utils.log_error("Failed to build Debian package: %s", exc)
    finally:
        shutil.rmtree(build_dir, ignore_errors=True)


def build_fedora_package(proj_root: str, oa_dir: str, coa_dir: str, base_ver: str, rel_num: str) -> None:
    clean_ver = base_ver.lstrip("v")
    pkg_name = f"oa-tools-{clean_ver}-{rel_num}"
    build_root = os.path.join("/tmp", f"rpmbuild_{pkg_name}")
    shutil.rmtree(build_root, ignore_errors=True)
    for d in ["BUILD", "BUILDROOT", "RPMS", "SOURCES", "SPECS", "SRPMS"]:
        os.makedirs(os.path.join(build_root, d), exist_ok=True)

    spec = os.path.join(build_root, "SPECS", "oa-tools.spec")
    spec_content = f"%define debug_package %{{nil}}\n\nName:           oa-tools\nVersion:        {clean_ver}\nRelease:        {rel_num}%{{?dist}}\nSummary:        coa is the mind and oa the arm\nLicense:        GPLv3\nURL:            https://penguins-eggs.net/blog/eggs-bananas\n\nRequires:       bash-completion\nRequires:       squashfs-tools\nRequires:       xorriso\nRequires:       dosfstools\nRequires:       mtools\nRequires:       dracut-live\nRequires:       gdisk\nRequires:       git\nRequires:       rsync\nRequires:       sudo\nRequires:       google-noto-emoji-fonts\nRequires:       grub2-pc-modules\nRequires:       grub2-efi-x64-modules\nRequires:       efibootmgr\nRequires:       shim-x64\nConflicts:      penguins-eggs\n\n%description\noa-tools: la rimasterizzazione universale secondo la filosofia eggs-bananas.\nInclude il supporto completo per shell completions e branding grafico per il boot.\n\n%install\nrm -rf %{{buildroot}}\nmkdir -p %{{buildroot}}/usr/bin\nmkdir -p %{{buildroot}}/etc/oa-tools.d/brain.d/assets\nmkdir -p %{{buildroot}}/etc/oa-tools.d/brain.d/modules\nmkdir -p %{{buildroot}}/usr/share/man/man1\nmkdir -p %{{buildroot}}/usr/share/bash-completion/completions\nmkdir -p %{{buildroot}}/usr/share/zsh/vendor-completions\nmkdir -p %{{buildroot}}/usr/share/fish/vendor_completions.d\ninstall -m 0755 {os.path.join(oa_dir, 'oa')} %{{buildroot}}/usr/bin/oa\ninstall -m 0755 {os.path.join(coa_dir, 'coa')} %{{buildroot}}/usr/bin/coa\nln -s coa %{{buildroot}}/usr/bin/eggs\ncp -a {os.path.join(coa_dir, 'brain.d', '*')} %{{buildroot}}/etc/oa-tools.d/brain.d/\ncat <<EOF > %{{buildroot}}/etc/oa-tools.d/oa-tools.yaml\n---\nsystem:\n  dialect: \"oa\"\n  version: \"{clean_ver}\"\nwardrobe:\n  root: \"~/.oa-wardrobe\"\n  repo: \"https://github.com/pieroproietti/oa-wardrobe.git\"\nremaster:\n  default_user: \"artisan\"\n  work_dir: \"/home/eggs\"\nEOF\n"
    if os.path.exists(os.path.join(coa_dir, "docs", "man")):
        spec_content += f"cp {os.path.join(coa_dir, 'docs', 'man', '*.1')} %{{buildroot}}/usr/share/man/man1/\ngzip -9 %{{buildroot}}/usr/share/man/man1/*.1\n"
    if os.path.exists(os.path.join(coa_dir, "docs", "completion")):
        spec_content += f"install -m 0644 {os.path.join(coa_dir, 'docs', 'completion', 'coa.bash')} %{{buildroot}}/usr/share/bash-completion/completions/coa\n"
    spec_content += "%files\n/usr/bin/oa\n/usr/bin/coa\n/usr/bin/eggs\n%dir /etc/oa-tools.d\n%dir /etc/oa-tools.d/brain.d\n%config(noreplace) /etc/oa-tools.d/oa-tools.yaml\n/usr/share/man/man1/*.1.gz\n/usr/share/bash-completion/completions/*\n/usr/share/zsh/vendor-completions/*\n/usr/share/fish/vendor_completions.d/*\n"
    with open(spec, "w", encoding="utf-8") as fp:
        fp.write(spec_content)
    rpm_result = _run(["rpmbuild", "-bb", "--define", f"_topdir {build_root}", spec], cwd=build_root)
    if rpm_result.returncode != 0:
        utils.log_error("RPM build failed")
        return
    matches = glob.glob(os.path.join(build_root, "RPMS", "x86_64", "*.rpm"))
    if matches:
        final = os.path.join(proj_root, os.path.basename(matches[0]))
        shutil.move(matches[0], final)
        utils.log_success("RPM created: %s", final)
    shutil.rmtree(build_root, ignore_errors=True)
