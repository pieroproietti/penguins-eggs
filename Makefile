# 1. THE SINGLE SOURCE OF TRUTH
VERSION := $(shell git describe --tags --always 2>/dev/null || echo "0.0.0-dev")

# Directories
OA_DIR = oa
COA_DIR = coa

# Binaries
OA_BIN = $(OA_DIR)/oa
COA_BIN = $(COA_DIR)/coa

# Patterns per i pacchetti nativi
PACKAGES = *.deb *.rpm *.pkg.tar.zst PKGBUILD

# Target principale
all: build_py
	@echo "--------------------------------------"
	@echo "Hatching completed successfully! 🐣"
	@echo "Version:           $(VERSION)"
	@echo "coa Brain (Python):    ./$(COA_BIN)"
	@echo "oa Workhorse (Python): ./$(OA_BIN)"
	@echo "--------------------------------------"

build_py:
	@echo "  USING Python OA/COA wrappers..."
	@chmod +x $(OA_BIN) $(COA_BIN)

build_oa_native:
	@echo "  MAKING native oa..."
	@$(MAKE) -C $(OA_DIR) VERSION="$(VERSION)" LIBS="-lcrypt"

build_coa_native:
	@echo "  MAKING native coa..."
	@cd $(COA_DIR) && go build -ldflags "-X 'coa/pkg/cmd.AppVersion=$(VERSION)'" -o coa main.go

# Target dedicato: da lanciare solo quando vuoi aggiornare i docs su Git
docs: build_coa
	@echo "  GENERATING DOCUMENTATION & COMPLETIONS..."
	@mkdir -p $(COA_DIR)/docs/md $(COA_DIR)/docs/completion
	@-./$(COA_BIN) _gen_docs --target ./$(COA_DIR)/docs/md
	@-./$(COA_BIN) completion bash > $(COA_DIR)/docs/completion/coa.bash>/dev/null || true

clean:
	@echo "  Pulizia binari e piani di volo..."
	@$(MAKE) -C $(OA_DIR) clean || true
	@rm -f $(COA_BIN)
	@rm -f /tmp/oa-remaster.json /tmp/sysinstall.json /tmp/coa/finalize-plan.json
	@echo "  Rimozione pacchetti nativi ($(PACKAGES))..."
	@rm -f $(PACKAGES)
	@echo "  Pulizia documentazione e completamenti..."
	@rm -rf $(COA_DIR)/docs/man/*
	@rm -rf $(COA_DIR)/docs/completion/*
	@rm -rf $(COA_DIR)/docs/md/*

.PHONY: all build_oa build_coa clean