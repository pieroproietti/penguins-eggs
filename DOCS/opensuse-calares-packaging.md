# OpenSUSE packaging

* sudo zypper install rpm-build rpmdevtools
* rpmdev-setuptree
* git clone https://github.com/calamares/calamares.git
* cd calamares
VERSION=3.3.15
git archive --format=tar.gz --prefix=calamares-${VERSION}/ HEAD > ../calamares-${VERSION}.tar.gz
* mv ../calamares-${VERSION}.tar.gz ../rpmbuild/SOURCES/
* cp opensuse-calamares.spec ~/rpmbuild/SPEC
* cd rpmbuild/SPEC
