# Makefile — Penguins Powerwash
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

# Integration plugin directories (other tools must be installed first)
EGGS_PLUGIN_DIR      ?= $(PREFIX)/share/penguins-eggs/plugins
RECOVERY_PLUGIN_DIR  ?= $(PREFIX)/share/penguins-powerwash/plugins/distro
SHAREDIR             := $(PREFIX)/share/penguins-powerwash

.PHONY: install uninstall install-integration uninstall-integration check clean

install:
	@echo "Installing Penguins Powerwash to $(PREFIX)..."

	# Binary
	install -Dm755 bin/penguins-powerwash          $(BINDIR)/powerwash

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
	@echo "Removing Penguins Powerwash..."
	rm -f  $(BINDIR)/powerwash
	rm -rf $(LIBDIR)
	rm -f  $(SYSTEMDDIR)/powerwash-rebind.service
	rm -f  $(MANDIR)/powerwash.1
	@echo "Config and state directories preserved:"
	@echo "  $(CONFDIR)  $(STATEDIR)"
	@echo "Remove manually if desired."

# ── Integration scripts ───────────────────────────────────────────────────────
# Installs plugin scripts so penguins-eggs and penguins-recovery can discover
# penguins-powerwash automatically. Run after both tools are installed.

install-integration:
	@echo "Installing penguins-powerwash integration scripts..."

	# Ship integration sources to a stable share path
	install -Dm755 integration/eggs-plugin/powerwash-hook.sh \
	               $(SHAREDIR)/integration/eggs-plugin/powerwash-hook.sh
	install -Dm644 integration/eggs-plugin/README.md \
	               $(SHAREDIR)/integration/eggs-plugin/README.md
	install -Dm755 integration/recovery-plugin/powerwash-plugin.sh \
	               $(SHAREDIR)/integration/recovery-plugin/powerwash-plugin.sh
	install -Dm644 integration/recovery-plugin/README.md \
	               $(SHAREDIR)/integration/recovery-plugin/README.md

	# Create plugin directories and symlink into them
	install -dm755 $(EGGS_PLUGIN_DIR)
	ln -sf $(SHAREDIR)/integration/eggs-plugin/powerwash-hook.sh \
	       $(EGGS_PLUGIN_DIR)/powerwash-hook.sh
	@echo "  Linked eggs plugin → $(EGGS_PLUGIN_DIR)/powerwash-hook.sh"

	install -dm755 $(RECOVERY_PLUGIN_DIR)
	ln -sf $(SHAREDIR)/integration/recovery-plugin/powerwash-plugin.sh \
	       $(RECOVERY_PLUGIN_DIR)/powerwash-self-plugin.sh
	@echo "  Linked recovery plugin → $(RECOVERY_PLUGIN_DIR)/powerwash-self-plugin.sh"

	@echo "Integration install complete."

uninstall-integration:
	rm -f  $(EGGS_PLUGIN_DIR)/powerwash-hook.sh
	rm -f  $(RECOVERY_PLUGIN_DIR)/powerwash-self-plugin.sh
	rm -rf $(SHAREDIR)/integration

check:
	@echo "Running shellcheck..."
	@if command -v shellcheck >/dev/null 2>&1; then \
	    shellcheck -x \
	        bin/penguins-powerwash \
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
