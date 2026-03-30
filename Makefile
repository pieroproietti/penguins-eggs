# Penguins Immutable Framework — top-level Makefile

BINARY      := pif
PREFIX      ?= /usr/local
BINDIR      := $(PREFIX)/bin
MANDIR      := $(PREFIX)/share/man
SYSCONFDIR  ?= /etc
SYSTEMDDIR  ?= /usr/lib/systemd/system

GO          := go
GOFLAGS     := -trimpath -ldflags="-s -w"

.PHONY: all build install uninstall systemd test lint clean

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
