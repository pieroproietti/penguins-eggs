# Makefile — penguins-kernel-manager
#
# Python packaging is handled by pyproject.toml / pip.
# This Makefile covers integration script installation only.
#
# Targets:
#   install-integration    Install eggs + recovery plugin scripts
#   uninstall-integration  Remove installed integration scripts
#   dev                    Install package in editable mode with dev extras
#   test                   Run pytest
#   lint                   Run ruff + mypy

PREFIX      ?= /usr/local
SHAREDIR    := $(PREFIX)/share/penguins-kernel-manager

# Integration plugin directories (other tools must be installed first)
EGGS_PLUGIN_DIR      ?= $(PREFIX)/share/penguins-eggs/plugins
POWERWASH_PLUGIN_DIR ?= $(PREFIX)/share/penguins-powerwash/plugins/distro

.PHONY: install-integration uninstall-integration dev test lint

# ── Integration scripts ───────────────────────────────────────────────────────

install-integration:
	@echo "Installing penguins-kernel-manager integration scripts..."

	# Ship integration sources to a stable share path
	install -Dm755 integration/eggs-plugin/pkm-hook.sh \
	               $(SHAREDIR)/integration/eggs-plugin/pkm-hook.sh
	install -Dm644 integration/eggs-plugin/README.md \
	               $(SHAREDIR)/integration/eggs-plugin/README.md
	install -Dm755 integration/recovery-plugin/pkm-plugin.sh \
	               $(SHAREDIR)/integration/recovery-plugin/pkm-plugin.sh
	install -Dm644 integration/recovery-plugin/README.md \
	               $(SHAREDIR)/integration/recovery-plugin/README.md

	# Symlink into penguins-eggs plugin directory (if it exists)
	@if [ -d "$(EGGS_PLUGIN_DIR)" ]; then \
	    ln -sf $(SHAREDIR)/integration/eggs-plugin/pkm-hook.sh \
	           $(EGGS_PLUGIN_DIR)/pkm-hook.sh; \
	    echo "  Linked eggs plugin → $(EGGS_PLUGIN_DIR)/pkm-hook.sh"; \
	else \
	    echo "  penguins-eggs plugin dir not found ($(EGGS_PLUGIN_DIR)) — skipping symlink"; \
	    echo "  Run manually: ln -sf $(SHAREDIR)/integration/eggs-plugin/pkm-hook.sh $(EGGS_PLUGIN_DIR)/pkm-hook.sh"; \
	fi

	# Symlink into penguins-powerwash distro plugin directory (if it exists)
	@if [ -d "$(POWERWASH_PLUGIN_DIR)" ]; then \
	    ln -sf $(SHAREDIR)/integration/recovery-plugin/pkm-plugin.sh \
	           $(POWERWASH_PLUGIN_DIR)/pkm-plugin.sh; \
	    echo "  Linked powerwash plugin → $(POWERWASH_PLUGIN_DIR)/pkm-plugin.sh"; \
	else \
	    echo "  penguins-powerwash plugin dir not found ($(POWERWASH_PLUGIN_DIR)) — skipping symlink"; \
	    echo "  Run manually: ln -sf $(SHAREDIR)/integration/recovery-plugin/pkm-plugin.sh $(POWERWASH_PLUGIN_DIR)/pkm-plugin.sh"; \
	fi

	@echo "Integration install complete."

uninstall-integration:
	rm -f  $(EGGS_PLUGIN_DIR)/pkm-hook.sh
	rm -f  $(POWERWASH_PLUGIN_DIR)/pkm-plugin.sh
	rm -rf $(SHAREDIR)/integration

# ── Development ───────────────────────────────────────────────────────────────

dev:
	pip install -e ".[dev]"

test:
	pytest

lint:
	ruff check penguins_kernel_manager/
	mypy penguins_kernel_manager/
