# penguins-distrobuilder — top-level Makefile
# Delegates to distrobuilder/ (Go) and menu/ (Python) as needed.

DISTROBUILDER_BIN ?= /usr/local/bin/distrobuilder
DBMENU_BIN        ?= /usr/local/bin/dbmenu

.PHONY: all build install install-full run-menu run-menu-lxc clean help

all: build

## Build distrobuilder binary from source (requires Go 1.21+)
build:
	cd distrobuilder && go build -o $(DISTROBUILDER_BIN) ./cmd/distrobuilder

## Install distrobuilder binary + dbmenu (pipx) — does not register eggs plugin
install: build
	pipx install menu/ || pipx install distrobuilder-menu

## Full install: binary + dbmenu + eggs plugin + template + config
install-full:
	sudo ./scripts/install-distrobuilder.sh

## Full install, building distrobuilder from source instead of snap
install-full-source:
	sudo ./scripts/install-distrobuilder.sh --source

## Launch the TUI menu in LXD/Incus mode
run-menu:
	dbmenu

## Launch the TUI menu in LXC mode
run-menu-lxc:
	dbmenu --lxc

## Remove built binary
clean:
	rm -f $(DISTROBUILDER_BIN)

help:
	@grep -E '^##' Makefile | sed 's/## //'
