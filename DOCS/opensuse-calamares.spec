# Versione estratta dal tuo log
%define version 3.3.15
%define release 1

Name:           calamares
Version:        %{version}
Release:        %{release}%{?dist}
Summary:        Distribution-independent installer framework
License:        BSD-2-Clause
URL:            https://calamares.io/
Source0:        %{name}-%{version}.tar.gz

# --- DEPENDENZE DI COMPILAZIONE ---
BuildRequires:  extra-cmake-modules
BuildRequires:  yaml-cpp-devel
BuildRequires:  boost-devel
BuildRequires:  python3-devel
BuildRequires:  qt6-base-devel
BuildRequires:  qt6-declarative-devel
BuildRequires:  qt6-svg-devel
BuildRequires:  qt6-linguist-devel
BuildRequires:  qt6-tools-devel
BuildRequires:  kpmcore-devel
BuildRequires:  libpolkit-qt6-1-devel
BuildRequires:  kf6-kcoreaddons-devel
BuildRequires:  kf6-ki18n-devel
BuildRequires:  kf6-kauth-devel
BuildRequires:  kf6-kio-devel
BuildRequires:  kf6-solid-devel

# --- DEPENDENZE DI ESECUZIONE ---
Requires:       kpmcore
Requires:       squashfs
Requires:       python3-PyYAML
Requires:       python3-jsonschema

%description
Calamares is a distribution-independent installer framework.

%prep
%setup -q

%build
# Creiamo esplicitamente la directory di build e ci entriamo
mkdir build
cd build

# Usiamo il comando 'cmake' standard, non la macro.
# Il '..' alla fine dice a cmake di cercare i sorgenti nella directory genitore.
cmake \
    -DCMAKE_INSTALL_PREFIX=/usr \
    -DCMAKE_BUILD_TYPE=Release \
    -DUSE_KF6=ON \
    -DWITH_QT6=ON \
    ..

# Usiamo il comando 'make' standard.
make %{?_smp_mflags}

%install
# Eseguiamo 'make install' dalla directory di build.
# DESTDIR=%{buildroot} è FONDAMENTALE per installare i file
# nella directory temporanea corretta per la creazione del pacchetto.
make install DESTDIR=%{buildroot} -C build


%files
%defattr(-,root,root)
# Eseguibile principale
%{_bindir}/calamares

# Directory dei dati principali (configurazioni, moduli QML, etc.)
%{_datadir}/calamares/

# File per il menu delle applicazioni
# Dobbiamo correggere il nome che avevamo prima
/usr/share/applications/calamares.desktop

# Icona dell'applicazione
%{_datadir}/icons/hicolor/scalable/apps/calamares.svg

# Librerie condivise (file con versione e collegamenti principali)
%{_libdir}/libcalamares.so
%{_libdir}/libcalamares.so.*
%{_libdir}/libcalamaresui.so
%{_libdir}/libcalamaresui.so.*

# Directory dei moduli C++
%{_libdir}/calamares/

# File di sviluppo (headers)
%{_includedir}/libcalamares/

# File di configurazione per CMake (per altri programmi che usano Calamares)
%{_libdir}/cmake/Calamares/

# Regole di Polkit per i permessi
%{_datadir}/polkit-1/actions/com.github.calamares.calamares.policy

# Pagina di manuale
%{_mandir}/man8/calamares.8.gz

# File di traduzione per i moduli python
%{_datadir}/locale/*/LC_MESSAGES/calamares-python.mo

%changelog
* Mon Jun 16 2025 Tuo Nome <tua@email.com> - %{version}-%{release}
- Initial RPM package for openSUSE.

