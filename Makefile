# 1. THE SINGLE SOURCE OF TRUTH
VERSION := $(shell git describe --tags --always 2>/dev/null || echo "0.0.0-dev")

# Directory sorgenti (Struttura fissa del repository)
OA_DIR  = oa
COA_DIR = coa

# Binari generati localmente nelle rispettive directory
OA_BIN  = $(OA_DIR)/oa
COA_BIN = $(COA_DIR)/coa

# Patterns per la rimozione dei pacchetti nativi (Ora che li salviamo in root)
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
docs: build_coa
	@echo "  GENERATING DOCUMENTATION & COMPLETIONS..."
	# Creiamo la cartella docs nella ROOT del progetto (allineato con pack_arch/pack_debian)
	@mkdir -p docs
	# Generiamo la documentazione nella root
	@-$(COA_BIN) _gen_docs --target ./docs

# Target per la creazione del pacchetto nativo
package: all
	@echo "  PACKAGING NATIVE OS DISTRIBUTION..."
	# Usa il binario appena forgiato dal target 'all' per pacchettizzare se stesso
	@./$(COA_BIN) tools build
		
clean:
	@echo "  Pulizia binari e piani di volo..."
	@$(MAKE) -C $(OA_DIR) clean || true
	@rm -f $(OA_BIN) $(COA_BIN)
	@rm -f /tmp/oa-remaster.json /tmp/sysinstall.json /tmp/coa/finalize-plan.json
	@echo "  Rimozione pacchetti nativi ($(PACKAGES))..."
	@rm -f $(PACKAGES)
	@echo "  Pulizia documentazione e completamenti..."
	# Aggiornato per pulire la nuova cartella docs in root
	@rm -rf docs/man/*
	@rm -rf docs/completion/*
	@rm -rf docs/md/*

.PHONY: all build_oa build_coa docs package clean
