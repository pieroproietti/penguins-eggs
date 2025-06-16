# devel_basis
sudo zypper install -t pattern devel_basis

# Installazione qt5
sudo zypper install \
    boost-devel \
    extra-cmake-modules \
    kcompletion-devel \
    kconfig-devel \
    kcoreaddons-devel \
    kcrash-devel \
    ki18n-devel \
    kio-devel \
    kpackage-devel \
    kparts-devel \
    kpmcore-devel \
    kservice-devel \
    kwidgetsaddons-devel \
    libicu-devel \
    libpwquality-devel \
    libqt5-qtbase-devel \
    libqt5-qtdeclarative-devel \
    libqt5-qtsvg-devel \
    plasma-framework-devel \
    libpolkit-qt5-1-devel \
    python3-devel \
    python3-jsonschema
    python3-PyYAML \
    solid-devel parted-devel \
    squashfs \
    yaml-cpp-devel 

# clone calamares
git clone https://github.com/calamares/calamares.git

# Entra nella cartella del codice che hai clonato
cd calamares

# Crea e entra nella cartella di build
mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr -DFORCE_QT5=ON ..

# Avvia la compilazione vera e propria
# L'opzione -j$(nproc) usa tutti i core della tua CPU per accelerare il processo
make -j$(nproc)

# installazione QT6
sudo zypper install qt6-core-devel
sudo zypper install qt6-declarativeopcua-private-devel
sudo zypper install qt6-svg-devel