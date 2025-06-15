git clone https://github.com/calamares/calamares.git

sudo zypper install -t pattern devel_basis

sudo zypper install \
    extra-cmake-modules kpmcore-devel libpwquality-devel libyaml-cpp-devel \
    parted-devel polkit-qt-1-devel squashfs boost-devel libicu-devel \
    libqt5-linguist-devel libQt5Concurrent-devel libQt5Svg-devel \
    libKF5Crash-devel libKF5Parts-devel libKF5I18n-devel libKF5WidgetsAddons-devel \
    python3-PyYAML python3-jsonschema \
    libpolkit-qt5-1-devel yaml-cpp-devel kcoreaddons-devel

sudo zypper install libQt5DBus-devel
sudo zypper install libqt5-qtbase-devel
sudo zypper install libqt5-qtdeclarative-devel


# lavoro sporco
sudo zypper install kpmcore-devel parted-devel solid-devel

# clone calamares
git clone https://github.com/calamares/calamares.git

# Entra nella cartella del codice che hai clonato
cd calamares

# Crea e entra nella cartella di build
mkdir build
cd build

# Esegui CMake per configurare il progetto
# -DCMAKE_BUILD_TYPE=Release -> Ottimizza per la performance
# -DCMAKE_INSTALL_PREFIX=/usr -> Installa nei percorsi di sistema standard
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr -DFORCE_QT5=ON ..

# Avvia la compilazione vera e propria
# L'opzione -j$(nproc) usa tutti i core della tua CPU per accelerare il processo
make -j$(nproc)

# affnamento

sudo zypper install -t pattern devel_basis


# Componente fondamentale per il partizionamento
sudo zypper install kpmcore-devel 

# Librerie di base e di sistema
sudo zypper install extra-cmake-modules libpwquality-devel libyaml-cpp-devel \
    parted-devel polkit-qt-1-devel squashfs boost-devel libicu-devel 

# Pacchetti principali di sviluppo per Qt5
sudo zypper install libqt5-qtbase-devel libqt5-qtdeclarative-devel 

# Pacchetti di sviluppo per KDE Frameworks 5
sudo zypper install libKF5CoreAddons-devel libKF5I18n-devel libKF5WidgetsAddons-devel \
libKF5Parts-devel libKF5Crash-devel libKF5Service-devel

# Pacchetti di sviluppo per Python (metodo corretto per openSUSE)
sudo zypper install python3-devel python3-PyYAML python3-jsonschema

sudo zipper install ki18n-devel
sudo zipper install kwidgetsaddons-devel
sudo zipper install kparts-devel

