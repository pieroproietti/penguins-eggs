#
# Meta-package spec per dipendenze penguins-eggs
# Compatibile: Fedora, RHEL/Alma/Rocky, openSUSE
#
Name:           penguins-eggs-deps
Version:        1.0.0
Release:        1%{?dist}
Summary:        Meta-package for penguins-eggs runtime dependencies
License:        GPL-3.0-or-later
URL:            https://penguins-eggs.net/

# FONDAMENTALE: Questo pacchetto non contiene binari, quindi va bene per qualsiasi CPU
BuildArch:      noarch

# Non vogliamo che RPM cerchi automaticamente dipendenze dentro file vuoti
AutoReqProv:    no

# ==============================================================================
# DIPENDENZE DI RUNTIME COMUNI
# ==============================================================================
Requires:       bash-completion
Requires:       cryptsetup
Requires:       curl
Requires:       device-mapper
Requires:       dosfstools
Requires:       dracut
Requires:       efibootmgr
Requires:       fuse
Requires:       git
Requires:       jq
Requires:       lvm2
# Nota: Se la tua AppImage include già Node.js, puoi commentare la riga sotto
# Requires:       nodejs
Requires:       nvme-cli
Requires:       parted
Requires:       polkit
Requires:       rsync
Requires:       sshfs
Requires:       wget
Requires:       xdg-utils
Requires:       xorriso
Requires:       zstd

# ==============================================================================
# DIPENDENZE CONDIZIONALI (Distro-specifiche)
# ==============================================================================
%if 0%{?suse_version}
# openSUSE (Slowroll, Tumbleweed, Leap)
Requires:       dracut-kiwi-live
Requires:       squashfs
%else
# Fedora / RHEL / EL9
Requires:       dracut-live
Requires:       squashfs-tools
%endif

%description
This is a meta-package that installs all necessary runtime dependencies 
for running penguins-eggs from an AppImage or standalone binary.
It contains no files, only dependency links.

%prep
# Non dobbiamo preparare sorgenti, creiamo solo un file README finto
echo "Questo pacchetto serve solo per installare le dipendenze di penguins-eggs" > README.txt

%build
# Nessuna compilazione necessaria

%install
# Creiamo una directory di documentazione fittizia per avere "qualcosa" nel pacchetto
install -d -m 755 %{buildroot}%{_docdir}/%{name}
install -m 644 README.txt %{buildroot}%{_docdir}/%{name}/README.txt

%files
%dir %{_docdir}/%{name}
%{_docdir}/%{name}/README.txt

%changelog
* Mon Nov 24 2025 Piero Proietti <piero.proietti@gmail.com> - 1.0.0-2
- Added missing squashfs/squashfs-tools dependency
* Sat Nov 22 2025 Piero Proietti <piero.proietti@gmail.com> - 1.0.0-1
- Initial meta-package creation
