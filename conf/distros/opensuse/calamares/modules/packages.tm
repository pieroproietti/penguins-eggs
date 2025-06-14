---
#
# Which package manager to use, options are:
#  - packagekit  - PackageKit CLI tool
#  - zypp        - Zypp RPM frontend
#  - yum         - Yum RPM frontend
#  - dnf         - DNF, the new RPM frontend
#  - urpmi       - Mandriva package manager
#  - apt         - APT frontend for DEB and RPM
#  - pacman      - Pacman
#  - portage	 - Gentoo package manager
#  - entropy	 - Sabayon package manager
#
backend: zypp

update_db: false

#
# List of maps with package operations such as install or remove.
# Distro developers can provide a list of packages to remove
# from the installed system (for instance packages meant only
# for the live system).
#
# A job implementing a distro specific logic to determine other
# packages that need to be installed or removed can run before
# this one. Distro developers may want to install locale packages
# or remove drivers not needed on the installed system.
# This job will populate a list of dictionaries in the global
# storage called "packageOperations" and it is processed
# after the static list in the job configuration.
#
operations:
#  - install:
#      - pkg1
#      - pkg2
   - try_remove:    # no system install failure if a package cannot be removed
       - libkpmcore4   # Also gets rid of Calamares, for Leap systems
       - libkpmcore5   # Also gets rid of Calamares, for Tumbleweed systems
   - try_remove:           # Remove additional deps of Calamares deps (needs to be separate remove step for some reason.)
       - libKF5Parts5  # Don't remove this on a Plasma system!
   - try_remove:
       - calamares-branding-upstream      # Remnant of Calamares
#  - try_install:   # no system install failure if a package cannot be installed
#      - pkg5
#  - install:
#      - pkgs6
#      - pkg7
#  - localInstall:
#      - /path/to/pkg8
