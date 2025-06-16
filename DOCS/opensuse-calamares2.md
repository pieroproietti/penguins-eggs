* sudo zypper install -t pattern devel_basis
* sudo zypper install extra-cmake-modules kpmcore-devel yaml-cpp-devel boost-devel plasma5-libqt5-devel qt5-qttools-devel squashfs
* sudo zypper install libqt5-qtbase-devel libQt5Svg-devel
* sudo zypper install libqt5-qttools-devel
* sudo zypper install libpolkit-qt5-1-devel 
* sudo zypper install libqt5-qtdeclarative-devel
* sudo zypper install kcoreaddons-devel
* sudo zypper install python3-devel

* git clone https://github.com/calamares/calamares.git
# cmake .. > log
```
- Skipped modules:
--   Skipped fsresizer (missing suitable KPMcore)
--   Skipped interactiveterminal (missing requirements)
--   Skipped partition (missing suitable KPMcore)
--   Skipped plasmalnf (missing requirements)
```
sudo zypper install qt6-tools-devel
sudo zypper install python3-PyYAML python3-jsonschema

* cmake .. > log
# OK
* make





