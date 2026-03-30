Name:           lkm
Version:        0.1.0
Release:        1%{?dist}
Summary:        Linux Kernel Manager — build, install, and manage kernels across all major distros

License:        GPL-3.0-or-later
URL:            https://github.com/Interested-Deving-1896/lkm
Source0:        https://github.com/Interested-Deving-1896/lkm/archive/refs/tags/v%{version}.tar.gz#/%{name}-%{version}.tar.gz

BuildArch:      noarch
BuildRequires:  python3-devel >= 3.11
BuildRequires:  python3-hatchling
BuildRequires:  python3-build
BuildRequires:  python3-installer
BuildRequires:  python3-wheel
BuildRequires:  python3-pytest

Requires:       python3 >= 3.11
Requires:       python3-docopt-ng
Requires:       python3-requests

Recommends:     python3-pyside6
Suggests:       lkf

%description
lkm installs, builds, and manages Linux kernels across all major
distributions and CPU architectures from a single CLI or Qt GUI.

It merges lkf (Linux Kernel Framework, shell build pipeline) and
ukm (Universal Kernel Manager, Python runtime management) into one
tool covering the full kernel lifecycle: build, install, hold, remove.

Supported package managers: apt, pacman, dnf, zypper, apk, portage,
xbps (Void Linux), and nix (NixOS).

%prep
%autosetup -n %{name}-%{version}

%build
%pyproject_wheel

%install
%pyproject_install
%pyproject_save_files lkm

# Install example profiles
install -dm755 %{buildroot}%{_datadir}/%{name}/profiles
install -m644 profiles/*.toml %{buildroot}%{_datadir}/%{name}/profiles/

%check
%pytest tests/ --tb=short

%files -f %{pyproject_files}
%license LICENSE
%doc README.md
%{_bindir}/lkm
%{_bindir}/lkm-gui
%{_datadir}/%{name}/

%changelog
* Sun Mar 30 2025 lkm contributors <lkm@example.com> - 0.1.0-1
- Initial release
- Merges lkf and ukm into a single unified tool
- Adds xbps backend for Void Linux
- Adds nix backend for NixOS with configuration.nix patching
- GUI Build tab for lkf profile and custom kernel builds
