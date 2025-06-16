sudo zypper install -t pattern devel_basis

sudo zypper install \
    extra-cmake-modules \
    yaml-cpp-devel \
    boost-devel \
    squashfs \
    python3-devel \
    python3-PyYAML \
    python3-jsonschema \
    qt6-base-devel \
    qt6-declarative-devel \
    qt6-svg-devel \
    qt6-linguist-devel \
    qt6-tools-devel \
    kpmcore-devel \
    libpolkit-qt6-1-devel \
    polkit-qt6-1-devel \
    kf6-kcoreaddons-devel \
    kf6-ki18n-devel \
    kf6-kauth-devel \
    kf6-kio-devel \
    kf6-solid-devel

* git clone https://github.com/calamares/calamares.git

* cd calamares
* mkdir build
* cd build
* cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr -DFORCE_QT6=ON ..
* make





