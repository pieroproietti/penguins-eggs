sudo zypper install -t pattern devel_basis
git clone https://github.com/calamares/calamares.git

sudo zypper install extra-cmake-modules kpmcore-devel libpwquality-devel \
libyaml-cpp-devel parted-devel plasma-framework-devel boost-devel \
polkit-qt-1-devel qt6-base-devel qt6-svg-devel qt6-tools-devel \
solid-devel squashfs

# cerca ed installa pacchetti mancanti

sudo zypper install libQt5Concurrent-devel
sudo zypper install libqt5-linguist-devel
sudo zypper install libQt5Svg-devel
sudo zypper install yaml-cpp-devel
sudo zypper install libpolkit-qt5-1-devel
sudo zypper install python3-pip python3-devel
sudo zypper install ki18n-devel
sudo zypper install kwidgetsaddons-devel
sudo zypper install kcrash-devel
sudo zypper install kf5-kparts-devel libicu-devel
sudo zypper install python3-PyYAML python3-jsonschema




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