# penguins-distrobuilder — top-level Makefile
# Delegates to distrobuilder/ (Go) and menu/ (Python) as needed.

DISTROBUILDER_BIN ?= /usr/local/bin/distrobuilder
DBMENU_BIN        ?= /usr/local/bin/dbmenu

.PHONY: all build install run-menu run-menu-lxc clean help

all: build

## Build distrobuilder binary from source
build:
	cd distrobuilder && go build -o $(DISTROBUILDER_BIN) ./cmd/distrobuilder

## Install distrobuilder binary + dbmenu (pipx)
install: build
	pipx install menu/ || pipx install distrobuilder-menu

## Launch the TUI menu in LXD mode
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
