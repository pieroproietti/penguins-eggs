# 1. THE SINGLE SOURCE OF TRUTH
VERSION := $(shell git describe --tags --always 2>/dev/null || echo "0.0.0-dev")

# Directory sorgenti (Struttura fissa del repository)
OA_DIR  = oa
COA_DIR = coa

# Binari generati localmente nelle rispettive directory
OA_BIN  = $(OA_DIR)/oa
COA_BIN = $(COA_DIR)/coa

# Patterns per la rimozione dei pacchetti nativi
PACKAGES = *.deb *.rpm *.pkg.tar.zst PKGBUILD

# Target principale
all: build_oa build_coa docs
	@echo "--------------------------------------"
	@echo "Hatching completed successfully! 🐣"
	@echo "Version:           $(VERSION)"
	@echo "coa Brain (Go):    $(COA_BIN)"
	@echo "oa Workhorse (C):  $(OA_BIN)"
	@echo "--------------------------------------"

build_oa:
	@echo "  MAKING oa (C Workhorse)..."
	@$(MAKE) -C $(OA_DIR) VERSION="$(VERSION)" LIBS="-lcrypt"

build_coa:
	@echo "  MAKING coa (Go Brain)..."
	@cd $(COA_DIR) && go build -ldflags "-X 'coa/pkg/cmd.AppVersion=$(VERSION)'" -o coa main.go

# Target Documentazione: Genera man pages, markdown e autocompletamenti nativi
# Target Documentazione: Genera man pages, markdown e autocompletamenti nativi
docs: build_coa
	@echo "  GENERATING DOCUMENTATION & COMPLETIONS..."
	# Creiamo solo la cartella di base per la documentazione
	@mkdir -p $(COA_DIR)/docs
	# Diciamo a _gen_docs di usare direttamente $(COA_DIR)/docs come base,
	# ci penserà lui a creare all'interno le cartelle man, md e completion
	@-$(COA_BIN) _gen_docs --target ./$(COA_DIR)/docs
		
clean:
	@echo "  Pulizia binari e piani di volo..."
	@$(MAKE) -C $(OA_DIR) clean || true
	@rm -f $(OA_BIN) $(COA_BIN)
	@rm -f /tmp/oa-remaster.json /tmp/sysinstall.json /tmp/coa/finalize-plan.json
	@echo "  Rimozione pacchetti nativi ($(PACKAGES))..."
	@rm -f $(PACKAGES)
	@echo "  Pulizia documentazione e completamenti..."
	@rm -rf $(COA_DIR)/docs/man/*
	@rm -rf $(COA_DIR)/docs/completion/*
	@rm -rf $(COA_DIR)/docs/md/*

.PHONY: all build_oa build_coa docs clean
