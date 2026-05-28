# 1. THE SINGLE SOURCE OF TRUTH
VERSION := $(shell git describe --tags --always 2>/dev/null || echo "0.0.0-dev")

# Directory sorgenti (Struttura fissa del repository)
OA_DIR  = oa
COA_DIR = coa

# La nostra stanza sterile temporanea
OA_BUILD_DIR ?= $(if $(GITHUB_WORKSPACE),$(GITHUB_WORKSPACE)/build,/tmp/oa-build-dir)
export OA_BUILD_DIR

# Binari generati e isolati nella stanza sterile
OA_BIN  = $(OA_BUILD_DIR)/oa
COA_BIN = $(OA_BUILD_DIR)/coa

# Patterns per la rimozione dei pacchetti nativi
PACKAGES = *.deb *.rpm *.pkg.tar.zst PKGBUILD

# ---------------------------------------------------------
# TARGET PRINCIPALE
# ---------------------------------------------------------
all: build_oa build_coa docs
	@echo "--------------------------------------"
	@echo "Hatching completed successfully! 🐣"
	@echo "Version:           $(VERSION)"
	@echo "coa Brain (Go):    $(COA_BIN)"
	@echo "oa Workhorse (C):  $(OA_BIN)"
	@echo "--------------------------------------"

# ---------------------------------------------------------
# COMPILATORI (IL BRACCIO E LA MENTE)
# ---------------------------------------------------------
build_oa:
	@echo "  MAKING oa (C Workhorse)..."
	@mkdir -p $(OA_BUILD_DIR)
	@$(MAKE) -C $(OA_DIR) VERSION="$(VERSION)" LIBS="-lcrypt"
	@# Spostiamo il binario appena forgiato nella stanza sterile
	@mv $(OA_DIR)/oa $(OA_BUILD_DIR)/oa

build_coa:
	@echo "  MAKING coa (Go Brain)..."
	@mkdir -p $(OA_BUILD_DIR)
	@# Diciamo a Go di salvare l'output (-o) direttamente nella stanza sterile
	@cd $(COA_DIR) && go build -ldflags "-X 'coa/pkg/cmd.AppVersion=$(VERSION)'" -o $(OA_BUILD_DIR)/coa main.go

# ---------------------------------------------------------
# ORCHESTRATORI (DOCUMENTAZIONE E PACCHETTI)
# ---------------------------------------------------------
docs: build_coa
	@echo "  GENERATING DOCUMENTATION & COMPLETIONS..."
	@mkdir -p docs
	@# Usa dinamicamente il binario appena pescato dalla stanza sterile
	@-$(COA_BIN) _gen_docs --target $(OA_BUILD_DIR)/docs

package: all
	@echo "  PACKAGING NATIVE OS DISTRIBUTION in $(OA_BUILD_DIR)..."
	@# Passiamo al cervello sia la stanza sterile che la vera radice del progetto
	@OA_BUILD_DIR=$(OA_BUILD_DIR) OA_PROJ_ROOT=$(PWD) $(COA_BIN) tools build
		
# ---------------------------------------------------------
# PULIZIA TOTALE
# ---------------------------------------------------------
clean:
	@echo "  Pulizia binari e piani di volo..."
	@$(MAKE) -C $(OA_DIR) clean || true
	@# Distruzione brutale della stanza sterile
	@rm -rf $(OA_BUILD_DIR)
	@rm -f /tmp/oa-remaster.json /tmp/sysinstall.json /tmp/coa/finalize-plan.json
	@echo "  Rimozione pacchetti nativi ($(PACKAGES))..."
	@rm -f $(PACKAGES)
	@echo "  Pulizia documentazione e completamenti..."
	@rm -rf docs/man/*
	@rm -rf docs/completion/*
	@rm -rf docs/md/*

.PHONY: all build_oa build_coa docs package clean
