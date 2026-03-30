# Penguins Immutable Framework — top-level Makefile

BINARY      := pif
PREFIX      ?= /usr/local
BINDIR      := $(PREFIX)/bin
MANDIR      := $(PREFIX)/share/man
SYSCONFDIR  ?= /etc
SYSTEMDDIR  ?= /usr/lib/systemd/system
SHAREDIR    := $(PREFIX)/share/penguins-immutable-framework

# Integration plugin directories (other tools must be installed first)
EGGS_PLUGIN_DIR      ?= $(PREFIX)/share/penguins-eggs/plugins
POWERWASH_PLUGIN_DIR ?= $(PREFIX)/share/penguins-powerwash/plugins/distro

GO          := go
GOFLAGS     := -trimpath -ldflags="-s -w"

.PHONY: all build install uninstall install-integration uninstall-integration systemd test lint clean

all: build

# ── Build ─────────────────────────────────────────────────────────────────────

build:
	$(GO) build $(GOFLAGS) -o bin/$(BINARY) ./tools/pif

# ── Install ───────────────────────────────────────────────────────────────────

install: build
	install -Dm755 bin/$(BINARY) $(DESTDIR)$(BINDIR)/$(BINARY)
	install -Dm644 pif.toml.sample $(DESTDIR)$(SYSCONFDIR)/pif/pif.toml.sample
	install -Dm644 systemd/pif-update.service $(DESTDIR)$(SYSTEMDDIR)/pif-update.service
	install -Dm644 systemd/pif-update.timer   $(DESTDIR)$(SYSTEMDDIR)/pif-update.timer
	install -d $(DESTDIR)$(SYSCONFDIR)/pif/distros
	install -m644 distros/*.toml $(DESTDIR)$(SYSCONFDIR)/pif/distros/
	install -Dm644 man/man1/pif.1 $(DESTDIR)$(MANDIR)/man1/pif.1

uninstall:
	rm -f $(DESTDIR)$(BINDIR)/$(BINARY)
	rm -f $(DESTDIR)$(SYSTEMDDIR)/pif-update.service
	rm -f $(DESTDIR)$(SYSTEMDDIR)/pif-update.timer

# ── Integration scripts ───────────────────────────────────────────────────────
# Installs plugin scripts so penguins-eggs and penguins-powerwash can discover
# penguins-immutable-framework automatically. Run after both tools are installed.

install-integration:
	@echo "Installing penguins-immutable-framework integration scripts..."

	# Ship integration sources to a stable share path
	install -Dm755 integration/eggs-plugin/pif-hook.sh \
	               $(DESTDIR)$(SHAREDIR)/integration/eggs-plugin/pif-hook.sh
	install -Dm644 integration/eggs-plugin/README.md \
	               $(DESTDIR)$(SHAREDIR)/integration/eggs-plugin/README.md
	install -Dm755 integration/recovery-plugin/pif-plugin.sh \
	               $(DESTDIR)$(SHAREDIR)/integration/recovery-plugin/pif-plugin.sh
	install -Dm644 integration/recovery-plugin/README.md \
	               $(DESTDIR)$(SHAREDIR)/integration/recovery-plugin/README.md

	# Create plugin directories and symlink into them
	install -dm755 $(DESTDIR)$(EGGS_PLUGIN_DIR)
	ln -sf $(SHAREDIR)/integration/eggs-plugin/pif-hook.sh \
	       $(DESTDIR)$(EGGS_PLUGIN_DIR)/pif-hook.sh
	@echo "  Linked eggs plugin → $(EGGS_PLUGIN_DIR)/pif-hook.sh"

	install -dm755 $(DESTDIR)$(POWERWASH_PLUGIN_DIR)
	ln -sf $(SHAREDIR)/integration/recovery-plugin/pif-plugin.sh \
	       $(DESTDIR)$(POWERWASH_PLUGIN_DIR)/pif-plugin.sh
	@echo "  Linked powerwash plugin → $(POWERWASH_PLUGIN_DIR)/pif-plugin.sh"

	@echo "Integration install complete."

uninstall-integration:
	rm -f  $(DESTDIR)$(EGGS_PLUGIN_DIR)/pif-hook.sh
	rm -f  $(DESTDIR)$(POWERWASH_PLUGIN_DIR)/pif-plugin.sh
	rm -rf $(DESTDIR)$(SHAREDIR)/integration

# ── Systemd ───────────────────────────────────────────────────────────────────

systemd:
	systemctl daemon-reload
	systemctl enable --now pif-update.timer

# ── Tests ─────────────────────────────────────────────────────────────────────

test:
	$(GO) test ./...

test-integration:
	@echo "Integration tests require root and a BTRFS loopback device."
	sudo bash tests/integration/run_all.sh

# ── Lint ──────────────────────────────────────────────────────────────────────

lint:
	golangci-lint run ./...

# ── Clean ─────────────────────────────────────────────────────────────────────

clean:
	rm -rf bin/
