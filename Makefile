VERSION := $(shell git describe --tags --always 2>/dev/null | sed 's/-g[0-9a-f]*$$//' || echo "0.0.0-dev")

OA_DIR  = oa
COA_DIR = coa

OA_BUILD_DIR ?= $(if $(GITHUB_WORKSPACE),$(GITHUB_WORKSPACE)/build,/tmp/oa-build-dir)
export OA_BUILD_DIR

OA_BIN  = $(OA_BUILD_DIR)/oa
COA_BIN = $(OA_BUILD_DIR)/coa

PACKAGES = *.deb *.rpm *.pkg.tar.zst PKGBUILD

# -----------------------------------------------------------
all: build_oa build_coa docs
	@echo "--------------------------------------"
	@echo "Hatching completed successfully! 🐣"
	@echo "Version:           $(VERSION)"
	@echo "coa Brain (Go):    $(COA_BIN)"
	@echo "oa Workhorse (C):  $(OA_BIN)"
	@echo "--------------------------------------"

# -----------------------------------------------------------
# Build
# -----------------------------------------------------------
build_oa: | $(OA_BUILD_DIR)
	@echo "  MAKING oa (C)..."
	@$(MAKE) -C $(OA_DIR) VERSION="$(VERSION)" LIBS="-lcrypt"
	@mv $(OA_DIR)/oa $(OA_BIN)

build_coa: | $(OA_BUILD_DIR)
	@echo "  MAKING coa (Go)..."
	@cd $(COA_DIR) && go build -ldflags "-X 'coa/pkg/cmd.AppVersion=$(VERSION)'" -o $(COA_BIN) main.go

$(OA_BUILD_DIR):
	@mkdir -p $@

# -----------------------------------------------------------
# Docs & packaging
# -----------------------------------------------------------
docs: build_coa
	@echo "  GENERATING DOCUMENTATION & COMPLETIONS..."
	@mkdir -p docs
	@-$(COA_BIN) _gen_docs --target $(OA_BUILD_DIR)/docs

package: all
	@echo "  PACKAGING NATIVE OS DISTRIBUTION..."
	@OA_BUILD_DIR=$(OA_BUILD_DIR) OA_PROJ_ROOT=$(PWD) $(COA_BIN) tools build

# -----------------------------------------------------------
# Clean
# -----------------------------------------------------------
clean:
	@echo "  Cleaning build artifacts..."
	@$(MAKE) -C $(OA_DIR) clean || true
	@rm -rf $(OA_BUILD_DIR)
	@rm -f /tmp/oa-remaster.json /tmp/sysinstall.json /tmp/coa/finalize-plan.json
	@rm -f $(PACKAGES)
	@rm -rf docs/man docs/completion docs/md

.PHONY: all build_oa build_coa docs package clean
