git clone https://github.com/calamares/calamares.git

sudo zypper install -t pattern devel_basis

sudo zypper install \
    # Librerie di sistema e C++ generiche
    extra-cmake-modules kpmcore-devel libpwquality-devel libyaml-cpp-devel \
    parted-devel polkit-qt-1-devel squashfs boost-devel libicu-devel \
    \
    # Librerie di sviluppo per Qt5
    libqt5-linguist-devel libQt5Concurrent-devel libQt5Svg-devel \
    \
    # Librerie di sviluppo per KDE Frameworks 5
    libKF5Crash-devel libKF5Parts-devel libKF5I18n-devel libKF5WidgetsAddons-devel \
    \
    # Dipendenze Python (metodo per openSUSE)
    python3-PyYAML python3-jsonschema

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