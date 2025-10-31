# Patch1: 0001-ariprova.patch
# Patch2: 0002-openmamba-fix-initramfs.patch

%define commit 3b7429094d05ee20246b5edb4afb17e7dac19f42
%define shortcommit %(echo %{commit} | cut -c1-7)

Name:          penguins-eggs
Version:       25.9.8
Release:       1mamba 
Summary:       A console tool that allows you to remaster your system and redistribute it as live images on USB sticks or via PXE
Group:         System/Tools
Vendor:        openmamba
Distribution:  openmamba
Packager:      Silvan Calarco <silvan.calarco@mambasoft.it>
URL:           https://penguins-eggs.net/
Source:        https://github.com/pieroproietti/penguins-eggs/archive/refs/tags/v%{version}.tar.gz#/%{name}-%{version}.tar.gz
Source1:        https://github.com/pieroproietti/penguins-bootloaders/releases/download/v%{bootloadersver}/bootloaders.tar.gz
License:       GPL
## AUTOBUILDREQ-BEGIN
BuildRequires: glibc-devel
BuildRequires: libgcc
## AUTOBUILDREQ-END
BuildRequires: pnpm
# Requires:      calamares
Requires:      dosfstools
Requires:      dracut
Requires:      findutils
Requires:      git
Requires:      grub
Requires:      jq
Requires:      libarchive-tools
Requires:      mtools
Requires:      nbd
Requires:      nodejs
Requires:      parted
Requires:      polkit
Requires:      procps-ng
Requires:      rsync
Requires:      squashfs
Requires:      sshfs
Requires:      wget
Requires:      xdg-utils

%description
A console tool that allows you to remaster your system and redistribute it as live images on USB sticks or via PXE.

%define debug_package %{nil}

# Remove an unresolved requirement from internal node module
%global __requires_exclude ^libc.so\\(\\)\\(64bit\\)$

%prep
%setup -q -a1

%build
pnpm install
pnpm build  

%install
[ "%{buildroot}" != / ] && rm -rf "%{buildroot}"

install -Dm644 .oclif.manifest.json package.json -t %{buildroot}%{_prefix}/lib/%{name}
cp -r \
   addons \
   assets \
   bin \
   bootloaders \
   conf \
   dist \
   dracut \
   eui \
   node_modules \
   scripts \
   %{buildroot}%{_prefix}/lib/%{name}

# Install bash-completion files
install -d %{buildroot}%{_datadir}/bash-completion/completions
ln -s /usr/lib/%{name}/scripts/eggs.bash \
   %{buildroot}%{_datadir}/bash-completion/completions/

# Install zsh-completion files
install -d %{buildroot}%{_datadir}/zsh/functions/Completion/Zsh/
ln -s ../lib/%{name}/scripts/_eggs \
   %{buildroot}%{_datadir}/zsh/functions/Completion/Zsh/

# Install man page
install -D -m0644 manpages/doc/man/eggs.1.gz -t %{buildroot}%{_mandir}/man1/

# Install desktop file
install -D -m0644 assets/%{name}.desktop -t %{buildroot}%{_datadir}/applications/

# Install icon
install -D -m0644 assets/eggs.png -t %{buildroot}%{_datadir}/pixmaps/

# Symlink executable
install -d %{buildroot}%{_bindir}
ln -s ../lib/%{name}/bin/run.js %{buildroot}%{_bindir}/eggs

# Remove prebuilt bootoader binaries causing unresolved dependencies in openmamba
rm -f %{buildroot}%{_prefix}/lib/penguins-eggs/bootloaders/grub/i386-pc/grub-bios-setup
rm -f %{buildroot}%{_prefix}/lib/penguins-eggs/bootloaders/grub/i386-pc/grub-ntldr-img

%clean
[ "%{buildroot}" != / ] && rm -rf "%{buildroot}"

%files
%defattr(-,root,root)
%{_bindir}/eggs
%{_datadir}/applications/penguins-eggs.desktop
%dir %{_prefix}/lib/penguins-eggs
%{_prefix}/lib/penguins-eggs/.oclif.manifest.json
%{_prefix}/lib/penguins-eggs/*
%{_datadir}/bash-completion/completions/eggs.bash
%{_datadir}/zsh/functions/Completion/Zsh/_eggs
%{_datadir}/pixmaps/eggs.png
%{_mandir}/man1/eggs.1*
%doc README.md

%changelog
* Thu Aug 28 2025 Silvan Calarco <silvan.calarco@mambasoft.it> 25.8.28-1mamba
- update to 25.8.28

* Wed Aug 06 2025 Automatic Build System <autodist@openmamba.org> 25.8.6-1mamba
- automatic version update by autodist

* Thu Jul 31 2025 Automatic Build System <autodist@openmamba.org> 25.7.30-1mamba
- automatic version update by autodist

* Thu Jul 24 2025 Automatic Build System <autodist@openmamba.org> 25.7.22-1mamba
- automatic version update by autodist

* Tue Jul 22 2025 Automatic Build System <autodist@openmamba.org> 25.7.14-1mamba
- automatic version update by autodist

* Wed May 28 2025 Automatic Build System <autodist@openmamba.org> 10.1.1-1mamba
- automatic version update by autodist

* Tue Mar 04 2025 Automatic Build System <autodist@openmamba.org> 10.0.60-1mamba
- automatic version update by autodist

* Sun Mar 02 2025 Automatic Build System <autodist@openmamba.org> 10.0.59-1mamba
- automatic version update by autodist

* Sat Dec 28 2024 Automatic Build System <autodist@openmamba.org> 10.0.57-1mamba
- automatic version update by autodist

* Tue Dec 17 2024 Automatic Build System <autodist@openmamba.org> 10.0.56-1mamba
- automatic version update by autodist

* Sat Dec 14 2024 Automatic Build System <autodist@openmamba.org> 10.0.55-1mamba
- automatic version update by autodist

* Wed Dec 11 2024 Automatic Build System <autodist@openmamba.org> 10.0.54-1mamba
- automatic version update by autodist

* Tue Dec 03 2024 Automatic Build System <autodist@openmamba.org> 10.0.53-1mamba
- automatic version update by autodist

* Wed Nov 27 2024 Silvan Calarco <silvan.calarco@mambasoft.it> 10.0.52-2mamba
- added a list of requirements

* Tue Nov 26 2024 Silvan Calarco <silvan.calarco@mambasoft.it> 10.0.52-1mamba
- package created using the webbuild interface