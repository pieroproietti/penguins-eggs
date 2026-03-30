# Immutable Linux Framework — top-level Makefile

BINARY      := ilf
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
	$(GO) build $(GOFLAGS) -o bin/$(BINARY) ./tools/ilf

# ── Install ───────────────────────────────────────────────────────────────────

install: build
	install -Dm755 bin/$(BINARY) $(DESTDIR)$(BINDIR)/$(BINARY)
	install -Dm644 ilf.toml.sample $(DESTDIR)$(SYSCONFDIR)/ilf/ilf.toml.sample
	install -Dm644 systemd/ilf-update.service $(DESTDIR)$(SYSTEMDDIR)/ilf-update.service
	install -Dm644 systemd/ilf-update.timer   $(DESTDIR)$(SYSTEMDDIR)/ilf-update.timer
	install -d $(DESTDIR)$(SYSCONFDIR)/ilf/distros
	install -m644 distros/*.toml $(DESTDIR)$(SYSCONFDIR)/ilf/distros/
	install -Dm644 man/man1/ilf.1 $(DESTDIR)$(MANDIR)/man1/ilf.1

uninstall:
	rm -f $(DESTDIR)$(BINDIR)/$(BINARY)
	rm -f $(DESTDIR)$(SYSTEMDDIR)/ilf-update.service
	rm -f $(DESTDIR)$(SYSTEMDDIR)/ilf-update.timer

# ── Systemd ───────────────────────────────────────────────────────────────────

systemd:
	systemctl daemon-reload
	systemctl enable --now ilf-update.timer

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
