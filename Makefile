# Makefile — Linux Powerwash
#
# Targets:
#   install    Install to /usr/local (default prefix)
#   uninstall  Remove installed files
#   check      Run shellcheck on all scripts
#   clean      Remove generated files

PREFIX     ?= /usr/local
BINDIR     := $(PREFIX)/bin
LIBDIR     := $(PREFIX)/lib/powerwash
PLUGINDIR  := $(PREFIX)/lib/powerwash/plugins
SYSTEMDDIR := /etc/systemd/system
CONFDIR    := /etc/powerwash
MANDIR     := $(PREFIX)/share/man/man1
STATEDIR   := /var/lib/powerwash
LOGDIR     := /var/log

.PHONY: install uninstall check clean

install:
	@echo "Installing Linux Powerwash to $(PREFIX)..."

	# Binary
	install -Dm755 bin/powerwash          $(BINDIR)/powerwash

	# Libraries
	install -Dm644 lib/common.sh          $(LIBDIR)/lib/common.sh
	install -Dm644 lib/distro.sh          $(LIBDIR)/lib/distro.sh
	install -Dm644 lib/filesystem.sh      $(LIBDIR)/lib/filesystem.sh
	install -Dm644 lib/backup.sh          $(LIBDIR)/lib/backup.sh
	install -Dm644 lib/plugin.sh          $(LIBDIR)/lib/plugin.sh

	# Modes
	install -Dm644 modes/soft.sh          $(LIBDIR)/modes/soft.sh
	install -Dm644 modes/medium.sh        $(LIBDIR)/modes/medium.sh
	install -Dm644 modes/hard.sh          $(LIBDIR)/modes/hard.sh
	install -Dm644 modes/sysprep.sh       $(LIBDIR)/modes/sysprep.sh
	install -Dm644 modes/hardware.sh      $(LIBDIR)/modes/hardware.sh

	# Plugins
	install -Dm644 plugins/distro/ubuntu-ppa.sh \
	               $(PLUGINDIR)/distro/ubuntu-ppa.sh
	install -Dm644 plugins/filesystem/btrfs-snapshot.sh \
	               $(PLUGINDIR)/filesystem/btrfs-snapshot.sh
	install -Dm644 plugins/hardware/amd-gpu.sh \
	               $(PLUGINDIR)/hardware/amd-gpu.sh

	# Systemd service and helper
	install -Dm644 systemd/powerwash-rebind.service \
	               $(SYSTEMDDIR)/powerwash-rebind.service
	install -Dm755 systemd/rebind-helper \
	               $(LIBDIR)/rebind-helper

	# Config (don't overwrite existing)
	install -Dm644 systemd/powerwash-rebind.conf \
	               $(CONFDIR)/rebind-devices.conf 2>/dev/null || true

	# Man page
	@if [ -f docs/powerwash.1 ]; then \
	    install -Dm644 docs/powerwash.1 $(MANDIR)/powerwash.1; \
	fi

	# State and log directories
	install -dm755 $(STATEDIR)
	install -dm755 $(STATEDIR)/backups

	# Patch the installed binary to point at the installed lib dir
	sed -i 's|_PW_ROOT=".*"|_PW_ROOT="$(LIBDIR)"|' $(BINDIR)/powerwash

	@echo "Installation complete."
	@echo "Run 'sudo powerwash --help' to get started."
	@echo ""
	@echo "To enable device rebind on resume:"
	@echo "  Edit $(CONFDIR)/rebind-devices.conf"
	@echo "  sudo systemctl enable --now powerwash-rebind.service"

uninstall:
	@echo "Removing Linux Powerwash..."
	rm -f  $(BINDIR)/powerwash
	rm -rf $(LIBDIR)
	rm -f  $(SYSTEMDDIR)/powerwash-rebind.service
	rm -f  $(MANDIR)/powerwash.1
	@echo "Config and state directories preserved:"
	@echo "  $(CONFDIR)  $(STATEDIR)"
	@echo "Remove manually if desired."

check:
	@echo "Running shellcheck..."
	@if command -v shellcheck >/dev/null 2>&1; then \
	    shellcheck -x \
	        bin/powerwash \
	        lib/*.sh \
	        modes/*.sh \
	        plugins/**/*.sh \
	        systemd/rebind-helper; \
	    echo "shellcheck passed."; \
	else \
	    echo "shellcheck not found. Install it: apt install shellcheck"; \
	fi

clean:
	find . -name "*.pw_backup_*" -delete
	find . -name "*.pw_disabled" -delete
