# 1. THE SINGLE SOURCE OF TRUTH
VERSION := $(shell git describe --tags --always 2>/dev/null || echo "0.0.0-dev")

# Directories e Build Output (Default locale, sovrascribile)
BUILD_DIR ?= .
OA_DIR = oa
COA_DIR = coa

# Binaries orientati al BUILD_DIR
OA_BIN = $(BUILD_DIR)/$(OA_DIR)/oa
COA_BIN = $(BUILD_DIR)/$(COA_DIR)/coa

# Patterns per i pacchetti nativi
PACKAGES = *.deb *.rpm *.pkg.tar.zst PKGBUILD

# Target principale
all: build_oa build_coa
	@echo "--------------------------------------"
	@echo "Hatching completed successfully! 🐣"
	@echo "Version:           $(VERSION)"
	@echo "coa Brain (Go):    $(COA_BIN)"
	@echo "oa Workhorse (C):  $(OA_BIN)"
	@echo "--------------------------------------"

build_oa:
	@echo "  MAKING oa..."
	# Passiamo BUILD_DIR e LIBS al Makefile interno
	@mkdir -p $(BUILD_DIR)/$(OA_DIR)
	@$(MAKE) -C $(OA_DIR) VERSION="$(VERSION)" LIBS="-lcrypt" BUILD_DIR="$(shell realpath $(BUILD_DIR))"

build_coa:
	@echo "  MAKING coa..."
	@mkdir -p $(BUILD_DIR)/$(COA_DIR)
	@cd $(COA_DIR) && go build -ldflags "-X 'coa/pkg/cmd.AppVersion=$(VERSION)'" -o $(shell realpath $(BUILD_DIR))/$(COA_DIR)/coa main.go

# Target dedicato
docs: build_coa
	@echo "  GENERATING DOCUMENTATION & COMPLETIONS..."
	@mkdir -p $(COA_DIR)/docs/md $(COA_DIR)/docs/completion
	@-$(COA_BIN) _gen_docs --target ./$(COA_DIR)/docs/md
	@-$(COA_BIN) completion bash > $(COA_DIR)/docs/completion/coa.bash 2>/dev/null || true

clean:
	@echo "  Pulizia binari e piani di volo..."
	@$(MAKE) -C $(OA_DIR) clean BUILD_DIR="$(shell realpath $(BUILD_DIR))" || true
	@rm -f $(COA_BIN)
	@rm -f /tmp/oa-remaster.json /tmp/sysinstall.json /tmp/coa/finalize-plan.json
	@echo "  Rimozione pacchetti nativi ($(PACKAGES))..."
	@rm -f $(PACKAGES)
	@echo "  Pulizia documentazione e completamenti..."
	@rm -rf $(COA_DIR)/docs/man/*
	@rm -rf $(COA_DIR)/docs/completion/*
	@rm -rf $(COA_DIR)/docs/md/*

.PHONY: all build_oa build_coa clean
